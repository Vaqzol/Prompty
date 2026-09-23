/* eslint @typescript-eslint/no-require-imports: "off" -- CommonJS is intentional for the isolated transpiled-module test harness. */
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const bcrypt = require('bcryptjs');
const root = path.resolve(__dirname, '..');
const env = {AUTH_SECRET:'test-only-secret-not-used-by-the-app', NODE_ENV:'test'};
function load(file, mocks = {}) {
  const source = fs.readFileSync(path.join(root,file),'utf8');
  const code = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  const exports = {};
  vm.runInNewContext(code,{exports,Buffer,Date,File,Uint8Array,console,process:{env},require(name) {
    if (name === 'server-only') return {};
    if (name in mocks) return mocks[name];
    if (name.startsWith('node:') || ['crypto','bcryptjs','otplib/functional','qrcode'].includes(name)) return require(name);
    throw new Error('Unmocked dependency (network/database forbidden): '+name);
  }},{filename:file});
  return exports;
}
const tokens = load('src/lib/security-tokens.ts');
const cryptoMfa = load('src/lib/mfa.ts');
const {generateSync} = require('otplib/functional');
function matches(row, where={}) {
  return Object.entries(where).every(([key,value])=>{
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('gt' in value) return row[key] > value.gt;
      if ('lte' in value) return row[key] <= value.lte;
      if ('startsWith' in value) return row[key].startsWith(value.startsWith);
    }
    return row[key] === value;
  });
}
function fixture() {
  const state={users:[{id:'user-a',email:'a@example.invalid',name:'Test',passwordHash:'hash:old-password',emailVerified:new Date(),role:'USER',status:'ACTIVE',mfaEnabled:false,mfaSecret:null,mfaBackupCodes:[]}],otp:[],tokens:[],writes:[],bookmarks:[]};
  const jar=new Map(), mail=[];
  let session={user:{id:'user-a',role:'USER',status:'ACTIVE',requiresMfa:false,mfaVerified:true,sessionId:'session-a'}};
  let locked=Promise.resolve();
  const model=(key)=>({
    findUnique:async({where})=>state[key].find(x=>matches(x,where)) || null,
    findFirst:async({where})=>state[key].find(x=>matches(x,where)) || null,
    create:async({data})=>{if(data.token && state[key].some(x=>x.token===data.token)) throw new Error('Unique violation');const row={id:'id-'+Math.random(),...data};state[key].push(row);return row;},
    deleteMany:async({where})=>{const old=state[key];state[key]=old.filter(x=>!matches(x,where));return {count:old.length-state[key].length};},
    update:async({where,data})=>{const row=state[key].find(x=>matches(x,where));if(!row)throw new Error('Missing row');state.writes.push({key,data});Object.assign(row,data);return row;},
    upsert:async({where,create,update})=>{const row=state[key].find(x=>matches(x,where));if(row){Object.assign(row,update);return row;}state[key].push(create);return create;},
  });
  const prisma={user:model('users'),otpCode:model('otp'),verificationToken:model('tokens'),bookmark:model('bookmarks'),bookmarkCollection:{findFirst:async()=>null},systemSetting:{findUnique:async()=>null},$queryRaw:async()=>[]};
  prisma.$transaction=async(fn)=>{
    const previous=locked;let release;locked=new Promise(r=>release=r);await previous;
    const before=structuredClone(state);
    try{return await fn(prisma);}catch(e){Object.assign(state,before);throw e;}finally{release();}
  };
  class AccessError extends Error {constructor(message,status){super(message);this.status=status;}}
  class RateLimitError extends Error {constructor(retryAfter){super('limited');this.retryAfter=retryAfter;}}
  const limiter={rateLimit:async()=>{},RateLimitError};
  const sessions={AccessError,requireSession:async(pending=false)=>{
    if(!session?.user?.id)throw new AccessError('login',401);
    if(session.user.status!=='ACTIVE' || (!pending && session.user.requiresMfa && !session.user.mfaVerified))throw new AccessError('forbidden',403);
    return session;
  },verifiedSession:async()=>session};
  const mocks={'@/lib/prisma':{prisma},'../prisma':{prisma},'@/lib/security-tokens':tokens,'./security-tokens':tokens,
    '@/lib/rate-limit':limiter,'./rate-limit':limiter,'@/lib/session':sessions,'./session':sessions,'@/lib/mfa':cryptoMfa,
    'next/cache':{revalidatePath:()=>{}},nodemailer:{createTransport:()=>({sendMail:async data=>mail.push(data)})},
    'next/headers':{cookies:async()=>({get:name=>jar.get(name),set:(name,value,options)=>jar.set(name,{value,options})})},
    bcryptjs:{hash:async value=>'hash:'+value,compare:async(value,hash)=>hash==='hash:'+value},
  };
  return {state,jar,mail,prisma,mocks,limiter,sessions,get session(){return session;},set session(value){session=value;},auth:()=>load('src/lib/actions/auth.ts',mocks),mfa:()=>load('src/lib/actions/mfa.ts',mocks)};
}
async function resetGrant(f) {
  const actions=f.auth();
  assert.equal((await actions.sendOtp('a@example.invalid','reset')).success,true);
  const code=f.mail[0].text.match(/\d{6}/)[0];
  assert.equal((await actions.verifyOtp('a@example.invalid',code,'reset')).success,true);
  return actions;
}

test('reset without OTP grant cannot write a password',async()=>{
 const f=fixture();assert.equal((await f.auth().resetPassword('a@example.invalid','new-password')).success,false);assert.equal(f.state.writes.length,0);
});
test('reset grant is bound to email, expires, and cannot be replayed',async()=>{
 const f=fixture(),a=await resetGrant(f);const grant=f.jar.get('prompty-reset');
 assert.equal(grant.options.httpOnly,true);assert.equal(grant.options.path,'/reset-password');
 assert.equal((await a.resetPassword('other@example.invalid','new-password')).success,false);
 f.state.tokens[0].expires=new Date(0);assert.equal((await a.resetPassword('a@example.invalid','new-password')).success,false);
 f.state.tokens[0].expires=new Date(Date.now()+60000);
 assert.equal((await a.resetPassword('a@example.invalid','new-password')).success,true);
 f.jar.set('prompty-reset',grant);
 assert.equal((await a.resetPassword('a@example.invalid','second-password')).success,false);
 assert.equal(f.state.users[0].passwordHash,'hash:new-password');
});
test('two reset submissions consume the grant only once',async()=>{
 const f=fixture(),a=await resetGrant(f);
 const results=await Promise.all([a.resetPassword('a@example.invalid','password-one'),a.resetPassword('a@example.invalid','password-two')]);
 assert.equal(results.filter(x=>x.success).length,1);
});
test('OTP purpose binding and storage hashing prevent registration OTP password resets',async()=>{
 const f=fixture();f.state.users[0].emailVerified=null;const a=f.auth();
 await a.sendOtp('a@example.invalid','register');const code=f.mail[0].text.match(/\d{6}/)[0];
 assert.notEqual(f.state.otp[0].code,code);
 assert.equal((await a.verifyOtp('a@example.invalid',code,'reset')).success,false);
 assert.equal((await a.verifyOtp('a@example.invalid',code,'register')).success,true);
 assert.equal(f.jar.size,0);assert.equal(f.state.otp.length,0);
 assert.equal((await a.verifyOtp('a@example.invalid',code,'register')).success,false);
});
test('failed transaction does not consume reset authorization',async()=>{
 const f=fixture(),a=await resetGrant(f);const original=f.prisma.user.update;
 f.prisma.user.update=async()=>{throw new Error('DB failure');};
 assert.equal((await a.resetPassword('a@example.invalid','new-password')).success,false);assert.equal(f.state.tokens.length,1);
 f.prisma.user.update=original;assert.equal((await a.resetPassword('a@example.invalid','new-password')).success,true);
});
test('password validation includes bcrypt byte limit',()=>{
 assert.equal(tokens.validPassword('short'),false);assert.equal(tokens.validPassword('x'.repeat(73)),false);
 assert.equal(tokens.validPassword('ก'.repeat(25)),false);assert.equal(tokens.validPassword('correct-password'),true);
});
test('preference mutation rejects role, secret fields and invalid types; normal settings work',async()=>{
 const f=fixture(),a=load('src/lib/actions/user.ts',f.mocks);
 for(const data of [{theme:'dark',role:'ADMIN'},{passwordHash:'bad'},{mfaEnabled:false},{notifyVotes:'yes'},{theme:'bad'}]) await assert.rejects(()=>a.updatePreferences(data));
 assert.equal(f.state.writes.length,0);
 await a.updatePreferences({theme:'dark',notifyVotes:false});
 assert.equal(f.state.users[0].theme,'dark');assert.equal(f.state.users[0].notifyVotes,false);assert.equal(f.state.users[0].role,'USER');
});
test('bookmark creation and moves reject another user collection',async()=>{
 const f=fixture(),a=load('src/lib/actions/bookmark.ts',f.mocks);
 assert.equal((await a.toggleBookmark('post-a','foreign')).success,false);
 assert.equal((await a.moveToCollection('bookmark-a','foreign')).success,false);assert.equal(f.state.writes.length,0);
 f.prisma.bookmarkCollection.findFirst=async()=>({id:'own'});
 assert.equal((await a.toggleBookmark('post-a','own')).success,true);
});
function callbacks(f) {
 let options;function NextAuth(o){options=o;return{};}NextAuth.CredentialsSignin=class extends Error{};
 load('src/auth.ts',{...f.mocks,'next-auth':NextAuth,'next-auth/providers/credentials':x=>x,'@auth/prisma-adapter':{PrismaAdapter:()=>({})}});
 return options.callbacks;
}
test('MFA grants are bound to stable session IDs, not rotating JWT iat',async()=>{
 const f=fixture();Object.assign(f.state.users[0],{mfaEnabled:true,mfaSecret:'encrypted-secret'});
 f.state.tokens.push({...tokens.mfaGrant('user-a','session-a','encrypted-secret'),expires:new Date(Date.now()+60000)});
 const cb=callbacks(f),base={id:'user-a',sessionId:'session-a',credentialVersion:tokens.credentialVersion('hash:old-password')};
 assert.equal((await cb.session({session:{user:{}},token:{...base,iat:1}})).user.mfaVerified,true);
 assert.equal((await cb.session({session:{user:{}},token:{...base,iat:9999999999}})).user.mfaVerified,true);
 assert.equal((await cb.session({session:{user:{}},token:{...base,sessionId:'session-b'}})).user.mfaVerified,false);
 f.state.tokens[0].expires=new Date(0);assert.equal((await cb.session({session:{user:{}},token:base})).user.mfaVerified,false);
});
test('database failure, deleted users, old JWTs and password changes fail closed',async()=>{
 const f=fixture(),cb=callbacks(f),token={id:'user-a',sessionId:'s',credentialVersion:tokens.credentialVersion('hash:old-password')};
 f.prisma.user.findUnique=async()=>{throw new Error('offline');};assert.equal((await cb.session({session:{user:{}},token})).user.id,'');
 f.prisma.user.findUnique=async()=>null;assert.equal((await cb.session({session:{user:{}},token})).user.id,'');
 f.prisma.user.findUnique=async()=>f.state.users[0];
 assert.equal((await cb.session({session:{user:{}},token:{id:'user-a'}})).user.id,'');
 f.state.users[0].passwordHash='hash:changed';assert.equal((await cb.session({session:{user:{}},token})).user.id,'');
});
test('direct MFA action requires a login and cannot verify arbitrary user IDs',async()=>{
 const f=fixture();f.session=null;const a=f.mfa();assert.equal((await a.verifyMfaLogin('123456')).success,false);assert.equal(f.state.tokens.length,0);
});
test('MFA enrollment requires server-issued setup and cannot overwrite existing MFA',async()=>{
 const f=fixture(),a=f.mfa();const secret=cryptoMfa.generateMfaSetupData;
 const generated=await secret('a@example.invalid');
 assert.equal((await a.confirmEnableMfa(generated.secret,generateSync({secret:generated.secret}))).success,false);
 const setup=await a.initMfaSetup();assert.equal(setup.success,true);
 const result=await a.confirmEnableMfa(setup.secret,generateSync({secret:setup.secret}));assert.equal(result.success,true);assert.equal(result.backupCodes.length,8);
 assert.equal((await a.confirmEnableMfa(setup.secret,generateSync({secret:setup.secret}))).success,false);
 assert.equal(f.state.users[0].mfaEnabled,true);
});
test('MFA backup code is consumed once under simultaneous requests',async()=>{
 const f=fixture(),code='ABCDEF12';Object.assign(f.state.users[0],{mfaEnabled:true,mfaSecret:cryptoMfa.encryptSecret('JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'),mfaBackupCodes:[await bcrypt.hash(code,4)]});
 const a=f.mfa();const results=await Promise.all([a.verifyMfaLogin(code),a.verifyMfaLogin(code)]);
 assert.equal(results.filter(x=>x.success).length,1);assert.equal(f.state.users[0].mfaBackupCodes.length,0);
});
test('TOTP replay cannot verify a second login',async()=>{
 const f=fixture(),secret='JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';Object.assign(f.state.users[0],{mfaEnabled:true,mfaSecret:cryptoMfa.encryptSecret(secret)});
 const a=f.mfa(),code=generateSync({secret});assert.equal((await a.verifyMfaLogin(code)).success,true);
 f.session.user.sessionId='session-b';assert.equal((await a.verifyMfaLogin(code)).success,false);
});
test('MFA rate limit applies even when called as a Server Action',async()=>{
 const f=fixture();f.limiter.rateLimit=async()=>{throw new f.limiter.RateLimitError(900);};
 assert.equal((await f.mfa().verifyMfaLogin('123456')).success,false);assert.equal(f.state.tokens.length,0);
});
test('session guard rejects pending MFA, banned users and maintenance',async()=>{
 const f=fixture();let maintenance=false;
 f.prisma.systemSetting.findUnique=async()=>({value:String(maintenance)});
 const guard=load('src/lib/session.ts',{'@/auth':{auth:async()=>f.session},'@/lib/prisma':{prisma:f.prisma}});
 f.session.user.requiresMfa=true;f.session.user.mfaVerified=false;
 await assert.rejects(()=>guard.requireSession());assert.ok(await guard.requireSession(true));
 f.session.user.status='BANNED';await assert.rejects(()=>guard.requireSession(true));
 f.session.user.status='ACTIVE';f.session.user.mfaVerified=true;maintenance=true;await assert.rejects(()=>guard.requireSession());
 f.session.user.role='ADMIN';assert.ok(await guard.requireSession());
});
const nextMock={NextResponse:{json:(body,init={})=>({body,status:init.status||200,headers:init.headers})}};
test('uploads deny guests/pending MFA before touching Storage and validate signatures',async()=>{
 const f=fixture();let uploads=0;
 const storage={upload:async()=>{uploads++;return {error:null};},getPublicUrl:()=>({data:{publicUrl:'https://test.invalid/image.png'}})};
 const upload=load('src/lib/upload.ts',{...f.mocks,'next/server':nextMock,'@supabase/supabase-js':{createClient:()=>({storage:{from:()=>storage}})}});
 const png=new File([Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0])],'x.png',{type:'image/png'});
 let file=png;const req={headers:new Headers(),nextUrl:{origin:'http://localhost'},formData:async()=>({get:()=>file})};
 f.session=null;assert.equal((await upload.uploadImage(req,'avatars',100)).status,401);
 f.session={user:{id:'a',status:'ACTIVE',requiresMfa:true,mfaVerified:false}};assert.equal((await upload.uploadImage(req,'avatars',100)).status,403);
 assert.equal(uploads,0);f.session.user.mfaVerified=true;
 file=new File(['<script>bad</script>'],'fake.png',{type:'image/png'});assert.equal((await upload.uploadImage(req,'avatars',100)).status,400);
 file=png;assert.equal((await upload.uploadImage(req,'avatars',5)).status,413);
 assert.equal((await upload.uploadImage(req,'avatars',100)).status,200);assert.equal(uploads,1);
});
test('AI validates auth and input before calls; rate failures return 429',async()=>{
 const f=fixture();let calls=0;
 const api=load('src/lib/ai-request.ts',{...f.mocks,'next/server':nextMock,'./gemini':{enhancePrompt:async()=>{calls++;return 'better';},suggestTags:async()=>['tag']}});
 let body={content:'hello',type:'PROMPT'};const req={headers:new Headers(),nextUrl:{origin:'http://localhost'},json:async()=>body};
 f.session.user.requiresMfa=true;f.session.user.mfaVerified=false;assert.equal((await api.aiRequest(req,'enhance')).status,403);
 f.session.user.mfaVerified=true;body.content={};assert.equal((await api.aiRequest(req,'enhance')).status,400);
 body.content='x'.repeat(12001);assert.equal((await api.aiRequest(req,'enhance')).status,400);assert.equal(calls,0);
 body.content='hello';assert.equal((await api.aiRequest(req,'enhance')).body.enhancedContent,'better');
 f.limiter.rateLimit=async()=>{throw new f.limiter.RateLimitError(30);};const res=await api.aiRequest(req,'tags');assert.equal(res.status,429);assert.equal(res.headers['Retry-After'],'30');
});
test('real PostgreSQL rate-limit SQL enforces the cap and resets an expired window',async()=>{
 const {PGlite}=require('@electric-sql/pglite');const db=new PGlite();
 try {
  await db.exec('CREATE TABLE "SystemSetting" ("key" text PRIMARY KEY, "value" text NOT NULL, "updatedAt" timestamp NOT NULL)');
  const prisma={$queryRaw:async(parts,...values)=>{let sql=parts[0];for(let i=0;i<values.length;i++)sql+='$'+(i+1)+parts[i+1];return (await db.query(sql,values)).rows;}};
  const limiter=load('src/lib/rate-limit.ts',{'@/lib/prisma':{prisma},'./security-tokens':tokens});
  const results=await Promise.allSettled(Array.from({length:20},()=>limiter.rateLimit('test','account',5,60)));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,5);
  assert.equal(results.filter(r=>r.status==='rejected' && r.reason instanceof limiter.RateLimitError).length,15);
  await db.exec(`UPDATE "SystemSetting" SET "value" = '{"count":6,"until":0}'`);
  await limiter.rateLimit('test','account',5,60);
  assert.equal((await db.query('SELECT count(*) AS n FROM "SystemSetting"')).rows[0].n,1);
 } finally {await db.close();}
});
