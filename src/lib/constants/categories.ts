export interface CategoryDef {
  slug: string;
  name: string;
  icon: string;
  description: string;
  tags: string[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: 'frontend',
    name: 'Frontend',
    icon: 'Code2',
    description: 'รวมโค้ด เทคนิค และเครื่องมือสำหรับการพัฒนาส่วนหน้าเว็บ (UI/UX)',
    tags: ['React', 'NextJS', 'Next.js', 'Vue', 'Angular', 'Svelte', 'TypeScript', 'JavaScript', 'CSS', 'TailwindCSS', 'Tailwind', 'HTML', 'SCSS', 'Sass', 'Bootstrap', 'Astro', 'Nuxt'],
  },
  {
    slug: 'backend',
    name: 'Backend',
    icon: 'Server',
    description: 'เซิร์ฟเวอร์ API ฐานข้อมูล และระบบหลังบ้าน',
    tags: ['Node', 'Node.js', 'Express', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask', 'Go', 'Golang', 'Rust', 'Java', 'Spring', 'PHP', 'Laravel', 'Ruby', 'Rails', 'GraphQL', 'REST', 'Prisma', 'PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Supabase', 'Firebase'],
  },
  {
    slug: 'prompt-art',
    name: 'Prompt Art',
    icon: 'Sparkles',
    description: 'Prompt สำหรับสร้างงานศิลปะและรูปภาพด้วย AI',
    tags: ['Midjourney', 'MidjourneyV6', 'DALL-E', 'StableDiffusion', 'Stable Diffusion', 'ComfyUI', 'AIArt', 'AI Art', 'Firefly', 'Leonardo', 'Flux'],
  },
  {
    slug: 'seo',
    name: 'SEO',
    icon: 'Search',
    description: 'เทคนิคการทำ SEO และการตลาดออนไลน์',
    tags: ['SEO', 'GoogleAnalytics', 'Google Analytics', 'SearchConsole', 'SEM', 'Marketing', 'ContentMarketing'],
  },
  {
    slug: 'devops',
    name: 'DevOps',
    icon: 'Container',
    description: 'CI/CD, Docker, Kubernetes และ Infrastructure',
    tags: ['Docker', 'Kubernetes', 'K8s', 'AWS', 'GCP', 'Azure', 'Terraform', 'CI/CD', 'GitHub Actions', 'GitLab', 'Nginx', 'Linux', 'Vercel', 'Netlify'],
  },
  {
    slug: 'ui-ux-design',
    name: 'UI/UX Design',
    icon: 'Palette',
    description: 'การออกแบบ UI/UX และเครื่องมือดีไซน์',
    tags: ['Figma', 'Sketch', 'AdobeXD', 'Design', 'UI', 'UX', 'Prototype', 'Wireframe', 'DesignSystem', 'Framer'],
  },
];
