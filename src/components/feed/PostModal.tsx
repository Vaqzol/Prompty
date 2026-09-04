'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Code2, Sparkles, ChevronDown, ImageIcon, Send, Loader2, Wand2, Tags } from 'lucide-react';
import { createPost, updatePost } from '@/lib/actions/post';
import hljs from 'highlight.js';
import Editor from 'react-simple-code-editor';

type PostType = 'CODE' | 'PROMPT';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // สำหรับโหมดแก้ไข
  editMode?: boolean;
  editData?: {
    id: string;
    type: PostType;
    title: string;
    description: string;
    content: string;
    language: string;
    aiModel: string;
    imageUrl: string;
    tags: string[];
  };
}

const LANGUAGES = ['React', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'HTML/CSS', 'SQL', 'Other'];
const AI_MODELS = ['Midjourney v6', 'DALL·E 3', 'Stable Diffusion XL', 'Leonardo AI', 'Firefly', 'Other'];

const hljsLangMap: Record<string, string> = {
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  python: 'Python',
  py: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C++',
  go: 'Go',
  rust: 'Rust',
  xml: 'HTML/CSS',
  html: 'HTML/CSS',
  css: 'HTML/CSS',
  sql: 'SQL',
  json: 'JavaScript',
  php: 'Other',
  ruby: 'Other',
  csharp: 'Other'
};

export default function PostModal({ isOpen, onClose, onSuccess, editMode = false, editData }: PostModalProps) {
  const [activeTab, setActiveTab] = useState<PostType>(editData?.type || 'CODE');
  const [title, setTitle] = useState(editData?.title || '');
  const [description, setDescription] = useState(editData?.description || '');
  const [content, setContent] = useState(editData?.content || '');
  const [language, setLanguage] = useState(editData?.language || '');
  const [aiModel, setAiModel] = useState(editData?.aiModel || 'Midjourney v6');
  // imageUrl = URL จาก Supabase Storage (หรือ Base64 เดิมถ้าเป็นโพสต์เก่า)
  const [imageUrl, setImageUrl] = useState(editData?.imageUrl || '');
  // imageFile = ไฟล์ที่ผู้ใช้เลือกใหม่ (ยังไม่ได้อัปโหลด)
  const [imageFile, setImageFile] = useState<File | null>(null);
  // imagePreview = URL local สำหรับ preview เท่านั้น ไม่กิน egress
  const [imagePreview, setImagePreview] = useState(editData?.imageUrl || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(editData?.tags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // AI states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState('');
  const [showEnhancePreview, setShowEnhancePreview] = useState(false);
  const [isSuggestingTags, setIsSuggestingTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [aiError, setAiError] = useState('');
  const [aiCooldown, setAiCooldown] = useState(0); // seconds remaining
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for rate limit cooldown
  useEffect(() => {
    if (aiCooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setAiCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          setAiError('');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current!);
  }, [aiCooldown > 0]);

  const startCooldown = (seconds = 60) => {
    clearInterval(cooldownRef.current!);
    setAiCooldown(seconds);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 10MB)');
        return;
      }
      // เก็บ File object ไว้อัปโหลดตอน submit
      setImageFile(file);
      // สร้าง local URL สำหรับ preview (ไม่กิน egress)
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);
      setError('');
    }
  };

  // อัปโหลดรูปจริงไป Supabase Storage
  const uploadImageToStorage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'อัปโหลดไม่สำเร็จ');
    return data.url as string;
  };

  useEffect(() => {
    if (activeTab !== 'CODE') return;
    
    if (!content.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDetecting(false);
      return;
    }

    setIsDetecting(true);
    
    const timeout = setTimeout(() => {
      try {
        const languageSubset = [
          'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 
          'go', 'rust', 'xml', 'css', 'sql', 'json', 'php', 'ruby', 'csharp'
        ];
        const result = hljs.highlightAuto(content, languageSubset);
        
        if (result.language) {
          const mapped = hljsLangMap[result.language.toLowerCase()] || 'Other';
          setLanguage(mapped);
          setIsAutoDetected(true);
          setTimeout(() => setIsAutoDetected(false), 2000);
        }
      } catch {

        // ignore
      } finally {
        setIsDetecting(false);
      }
    }, 600); // 600ms debounce for smoother feel

    return () => clearTimeout(timeout);
  }, [content, activeTab]);

  if (!isOpen) return null;

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, '');
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // ── AI: ปรับปรุง Prompt ──
  const handleEnhance = async () => {
    if (!content.trim()) {
      setAiError('กรุณากรอกเนื้อหาก่อนใช้ AI');
      return;
    }
    setAiError('');
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), type: activeTab }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI error');
      setEnhancedContent(data.enhancedContent);
      setShowEnhancePreview(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI ไม่สามารถประมวลผลได้';
      setAiError(msg);
      if (msg.includes('บ่อยเกินไป')) startCooldown(60);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAcceptEnhance = () => {
    setContent(enhancedContent);
    setShowEnhancePreview(false);
    setEnhancedContent('');
  };

  // ── AI: แนะนำ Tags ──
  const handleSuggestTags = async () => {
    if (!title.trim() && !content.trim()) {
      setAiError('กรุณากรอกชื่อเรื่องหรือเนื้อหาก่อน');
      return;
    }
    setAiError('');
    setIsSuggestingTags(true);
    setSuggestedTags([]);
    try {
      const res = await fetch('/api/ai/suggest-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, type: activeTab }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI error');
      // กรอง tags ที่มีอยู่แล้วออก
      const newTags = (data.tags || []).filter((t: string) => !tags.includes(t));
      setSuggestedTags(newTags);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'AI ไม่สามารถแนะนำแท็กได้';
      setAiError(msg);
      if (msg.includes('บ่อยเกินไป')) startCooldown(60);
    } finally {
      setIsSuggestingTags(false);
    }
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setSuggestedTags(suggestedTags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) {
      setError('กรุณาใส่ชื่อเรื่อง');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Auto-add any remaining tag in the input box if user forgot to press Enter
      let finalTags = tags;
      if (tagInput.trim()) {
        const pendingTag = tagInput.trim().replace(/^#/, '');
        if (pendingTag && !tags.includes(pendingTag)) {
          finalTags = [...tags, pendingTag];
        }
      }

      // อัปโหลดรูปไป Supabase Storage ถ้ามีรูปใหม่
      let finalImageUrl = imageUrl;
      if (activeTab === 'PROMPT' && imageFile) {
        setIsUploading(true);
        setError('');
        finalImageUrl = await uploadImageToStorage(imageFile);
        setIsUploading(false);
      }

      if (editMode && editData) {
        const result = await updatePost(editData.id, {
          title,
          description: description || undefined,
          content,
          language: activeTab === 'CODE' ? language : undefined,
          aiModel: activeTab === 'PROMPT' ? aiModel : undefined,
          imageUrl: activeTab === 'PROMPT' ? finalImageUrl : undefined,
          tags: finalTags,
        });
        if (!result.success) {
          setError(result.error || 'เกิดข้อผิดพลาด');
          return;
        }
      } else {
        const result = await createPost({
          title,
          description: description || undefined,
          content,
          type: activeTab,
          language: activeTab === 'CODE' ? language : undefined,
          aiModel: activeTab === 'PROMPT' ? aiModel : undefined,
          imageUrl: activeTab === 'PROMPT' ? finalImageUrl : undefined,
          tags: finalTags,
        });
        if (!result.success) {
          setError(result.error || 'เกิดข้อผิดพลาด');
          return;
        }
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setIsUploading(false);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{editMode ? 'แก้ไขโพสต์' : 'สร้างโพสต์'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher (ไม่แสดงในโหมดแก้ไข) */}
        {!editMode && (
          <div className="modal-tabs-wrapper">
            <div className="modal-tabs" style={{ position: 'relative' }}>
              <div 
                className="modal-tab-active-bg"
                style={{
                  position: 'absolute',
                  top: '4px',
                  bottom: '4px',
                  left: activeTab === 'CODE' ? '4px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 6px)',
                  background: 'var(--brand-primary)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.2)',
                  zIndex: 1
                }}
              />
              <button
                className={`modal-tab ${activeTab === 'CODE' ? 'active' : ''}`}
                style={{ position: 'relative', zIndex: 2 }}
                onClick={() => setActiveTab('CODE')}
              >
                <Code2 size={16} />
                แชร์ Code
              </button>
              <button
                className={`modal-tab ${activeTab === 'PROMPT' ? 'active' : ''}`}
                style={{ position: 'relative', zIndex: 2 }}
                onClick={() => setActiveTab('PROMPT')}
              >
                <Sparkles size={16} />
                แชร์ Prompt
              </button>
            </div>
          </div>
        )}

        {/* Form body */}
        <div className="modal-body">
          {error && <div className="modal-error">{error}</div>}

          <input
            type="text"
            className="modal-input-title"
            placeholder="ช่องใส่ชื่อเรื่อง"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="modal-input-desc"
            placeholder="ช่องอธิบาย"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          <div key={activeTab} className="modal-tab-content fade-in-anim">
            {/* ===== Code Tab ===== */}
            {activeTab === 'CODE' && (
              <>
                <div className="modal-lang-row">
                  <span className="modal-lang-label">ภาษา</span>
                  <div className={`modal-lang-select-wrapper ${isAutoDetected || isDetecting ? 'auto-detected' : ''}`}>
                    {isDetecting ? (
                      <Loader2 size={14} className="spin-anim" />
                    ) : (
                      <Sparkles size={14} className={isAutoDetected ? 'sparkle-anim' : ''} />
                    )}
                    <select
                      className="modal-lang-select"
                      value={isDetecting ? 'detecting' : language}
                      onChange={(e) => setLanguage(e.target.value)}
                      disabled={isDetecting}
                    >
                      {isDetecting && <option value="detecting">กำลังวิเคราะห์...</option>}
                      <option value="">อัตโนมัติ</option>
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{!isDetecting && isAutoDetected && language === lang ? `อัตโนมัติ: ${lang}` : lang}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} />
                  </div>
                </div>

                <div className="modal-code-editor">
                  <div className="modal-code-header">
                    <div className="modal-code-dots">
                      <span className="dot red" />
                      <span className="dot yellow" />
                      <span className="dot green" />
                    </div>
                  </div>
                  <div className="modal-code-editor-container">
                    <Editor
                      value={content}
                      onValueChange={code => setContent(code)}
                      highlight={code => {
                        if (!code) return '';
                        const languageSubset = [
                          'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 
                          'go', 'rust', 'xml', 'css', 'sql', 'json', 'php', 'ruby', 'csharp'
                        ];
                        return hljs.highlightAuto(code, languageSubset).value;
                      }}
                      padding={16}
                      className="modal-code-textarea"
                      placeholder="วางโค้ดของคุณที่นี่..."
                    />
                  </div>
                  <button
                    type="button"
                    className="ai-enhance-btn"
                    onClick={handleEnhance}
                    disabled={isEnhancing || !content.trim() || aiCooldown > 0}
                    title="AI ปรับปรุง Code"
                  >
                    {aiCooldown > 0 ? (
                      <>⏳ รอ {aiCooldown}s</>
                    ) : isEnhancing ? (
                      <><Loader2 size={14} className="spin" /> กำลังปรับปรุง...</>
                    ) : (
                      <><Wand2 size={14} /> ✨ AI ปรับปรุง Code</>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* ===== Prompt Tab ===== */}
            {activeTab === 'PROMPT' && (
              <>
                <div className="modal-prompt-section">
                  <textarea
                    className="modal-prompt-textarea"
                    placeholder="วางพรอมต์ของคุณที่นี่..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                  />
                  <button
                    type="button"
                    className="ai-enhance-btn"
                    onClick={handleEnhance}
                    disabled={isEnhancing || !content.trim() || aiCooldown > 0}
                    title="AI ปรับปรุง Prompt"
                  >
                    {aiCooldown > 0 ? (
                      <>⏳ รอ {aiCooldown}s</>
                    ) : isEnhancing ? (
                      <><Loader2 size={14} className="spin" /> กำลังปรับปรุง...</>
                    ) : (
                      <><Wand2 size={14} /> ✨ AI ปรับปรุง Prompt</>
                    )}
                  </button>
                </div>

                <div className="modal-prompt-upload">
                  {imagePreview ? (
                    <div className="modal-prompt-preview">
                      <img src={imagePreview} alt="Preview" />
                      <button onClick={() => { setImagePreview(''); setImageFile(null); setImageUrl(''); }} className="modal-prompt-remove">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                  <label className="modal-prompt-dropzone">
                    <ImageIcon size={32} />
                    <span>วางผลงานที่สร้างขึ้นที่นี่</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="modal-prompt-file-input"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="modal-tags-wrapper">
            <div className="modal-tags-area">
              <span className="modal-tags-hash">#</span>
              <input
                type="text"
                className="modal-tags-input"
                placeholder={activeTab === 'CODE' ? 'เพิ่มแท็ก (เช่น #React)...' : 'เพิ่มแท็ก (เช่น #Cyberpunk)...'}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
              <button
                type="button"
                className="ai-suggest-tags-btn"
                onClick={handleSuggestTags}
                disabled={isSuggestingTags || (!title.trim() && !content.trim()) || aiCooldown > 0}
                title="AI แนะนำ Tags"
              >
                {aiCooldown > 0 ? (
                  <>⏳ {aiCooldown}s</>
                ) : isSuggestingTags ? (
                  <><Loader2 size={12} className="spin" /> AI...</>
                ) : (
                  <><Tags size={12} /> AI แนะนำ</>
                )}
              </button>
            </div>
            <div className="modal-tags-list">
              {tags.map((tag) => (
                <span key={tag} className="modal-tag-pill" onClick={() => handleRemoveTag(tag)}>
                  #{tag} <X size={12} />
                </span>
              ))}
            </div>
            {/* AI suggested tags */}
            {suggestedTags.length > 0 && (
              <div className="ai-suggested-tags">
                <span className="ai-suggested-label">AI แนะนำ:</span>
                {suggestedTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="ai-suggested-tag-pill"
                    onClick={() => handleAddSuggestedTag(tag)}
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            )}
            {/* AI error */}
            {aiError && (
              <div className="ai-error-message">{aiError}</div>
            )}
          </div>

          <div className="modal-actions">
            <button className="modal-btn-cancel" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              className="modal-btn-submit"
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
            >
              {isUploading ? (
                <>กำลังอัปโหลดรูป...</>
              ) : editMode ? (
                <>บันทึก</>
              ) : (
                <>โพสต์ <Send size={16} style={{ marginLeft: 4 }} /></>
              )}
            </button>
          </div>
        </div>

        {/* ── AI Enhance Preview Popup ── */}
        {showEnhancePreview && (
          <div className="ai-enhance-overlay" onClick={() => setShowEnhancePreview(false)}>
            <div className="ai-enhance-popup" onClick={(e) => e.stopPropagation()}>
              <div className="ai-enhance-header">
                <h3>✨ AI ปรับปรุงแล้ว</h3>
                <button onClick={() => setShowEnhancePreview(false)}><X size={18} /></button>
              </div>
              <div className="ai-enhance-compare">
                <div className="ai-enhance-col">
                  <span className="ai-enhance-label">ก่อน</span>
                  <pre className="ai-enhance-content original">{content}</pre>
                </div>
                <div className="ai-enhance-col">
                  <span className="ai-enhance-label">หลัง (AI)</span>
                  <pre className="ai-enhance-content enhanced">{enhancedContent}</pre>
                </div>
              </div>
              <div className="ai-enhance-actions">
                <button className="ai-enhance-cancel" onClick={() => setShowEnhancePreview(false)}>ยกเลิก</button>
                <button className="ai-enhance-accept" onClick={handleAcceptEnhance}>✨ ใช้ Prompt ใหม่</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
