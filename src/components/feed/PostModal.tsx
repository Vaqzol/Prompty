'use client';

import { useState, useEffect } from 'react';
import { X, Code2, Sparkles, ChevronDown, ImageIcon, Send, Loader2 } from 'lucide-react';
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
  const [imageUrl, setImageUrl] = useState(editData?.imageUrl || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(editData?.tags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 10MB)');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
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
        console.log('Auto-detected language:', result.language, 'Relevance:', result.relevance);
        
        if (result.language) {
          const mapped = hljsLangMap[result.language.toLowerCase()] || 'Other';
          setLanguage(mapped);
          setIsAutoDetected(true);
          setTimeout(() => setIsAutoDetected(false), 2000);
        }
      } catch (e) {

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

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) {
      setError('กรุณาใส่ชื่อเรื่อง');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editMode && editData) {
        const result = await updatePost(editData.id, {
          title,
          description,
          content,
          language: activeTab === 'CODE' ? language : undefined,
          aiModel: activeTab === 'PROMPT' ? aiModel : undefined,
          imageUrl: activeTab === 'PROMPT' ? imageUrl : undefined,
          tags,
        });
        if (!result.success) {
          setError(result.error || 'เกิดข้อผิดพลาด');
          return;
        }
      } else {
        const result = await createPost({
          type: activeTab,
          title,
          description,
          content,
          language: activeTab === 'CODE' ? language : undefined,
          aiModel: activeTab === 'PROMPT' ? aiModel : undefined,
          imageUrl: activeTab === 'PROMPT' ? imageUrl : undefined,
          tags,
        });
        if (!result.success) {
          setError(result.error || 'เกิดข้อผิดพลาด');
          return;
        }
      }
      onSuccess?.();
      onClose();
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
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
                </div>
              </>
            )}

            {/* ===== Prompt Tab ===== */}
            {activeTab === 'PROMPT' && (
              <>
                <div className="modal-prompt-section">
                  <div className="modal-prompt-model-row">
                    <span className="modal-prompt-model-label">โมเดล AI</span>
                    <select
                      className="modal-prompt-model-select"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                    >
                      {AI_MODELS.map((model) => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    className="modal-prompt-textarea"
                    placeholder="วางพรอมต์ของคุณที่นี่"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="modal-prompt-upload">
                  {imageUrl ? (
                    <div className="modal-prompt-preview">
                      <img src={imageUrl} alt="Preview" />
                      <button onClick={() => setImageUrl('')} className="modal-prompt-remove">
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
              {tags.map((tag) => (
                <span key={tag} className="modal-tag-pill" onClick={() => handleRemoveTag(tag)}>
                  #{tag} <X size={12} />
                </span>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button className="modal-btn-cancel" onClick={onClose}>
              ยกเลิก
            </button>
            <button
              className="modal-btn-submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {editMode ? (
                <>บันทึก</>
              ) : (
                <>โพสต์ <Send size={16} style={{ marginLeft: 4 }} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
