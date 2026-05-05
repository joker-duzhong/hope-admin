import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Spin,
  Tabs,
  Typography,
  Divider,
  Button,
  Space,
  Form,
  Input,
  InputNumber,
  Message,
  Upload,
} from '@arco-design/web-react';
import { IconEdit, IconPlus } from '@arco-design/web-react/icon';
import { getBookDetail, updateBook, setupBookPersona, appendBookChapter } from '../api';
import type { BookDetail, BookUpdateParams, SetupPersonaParams, AppendChapterParams } from '../types';
import { uploadFiles } from '@/core/utils/upload';

const { TabPane } = Tabs;
const { Title, Paragraph, Text } = Typography;
const FormItem = Form.Item;

interface BookDetailViewerProps {
  visible: boolean;
  bookId: string | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

/**
 * 格式化日期字符串（替代 dayjs，避免额外依赖）
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const BookDetailViewer: React.FC<BookDetailViewerProps> = ({ visible, bookId, onClose, onUpdateSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<BookDetail | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [form] = Form.useForm<BookUpdateParams>();
  const [saving, setSaving] = useState(false);

  const [personaEditMode, setPersonaEditMode] = useState(false);
  const [personaForm] = Form.useForm<SetupPersonaParams>();
  const [savingPersona, setSavingPersona] = useState(false);

  const [chapterAddMode, setChapterAddMode] = useState(false);
  const [chapterForm] = Form.useForm<AppendChapterParams>();
  const [savingChapter, setSavingChapter] = useState(false);

  const customUploadRequest = async (option: any, fieldName: string, targetForm: any) => {
    const { file, onProgress, onSuccess, onError } = option;
    try {
      onProgress(20);
      const resources = await uploadFiles(file);
      onProgress(100);
      if (resources && resources.length > 0) {
        targetForm.setFieldValue(fieldName, resources[0].id);
        onSuccess(resources[0]);
      } else {
        throw new Error('上传失败，未获取到资源 ID');
      }
    } catch (error: any) {
      onError(error);
      Message.error(error.message || '上传失败');
    }
  };

  const fetchDetail = async () => {
    if (!bookId) return;
    setLoading(true);
    try {
      const res = await getBookDetail(bookId);
      setDetail(res.data.data);
      form.setFieldsValue({
        title: res.data.data.title,
        author: res.data.data.author,
        year: res.data.data.year,
        latitude: res.data.data.latitude,
        longitude: res.data.data.longitude,
        cover_url: res.data.data.cover_url,
        description: res.data.data.description,
      });
    } catch (error) {
      // 错误已由 request 统一拦截并提示
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && bookId) {
      setEditMode(false);
      setPersonaEditMode(false);
      setChapterAddMode(false);
      fetchDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, bookId]);

  const handleEditPersona = () => {
    if (detail?.ai_persona) {
      personaForm.setFieldsValue({
        name: detail.ai_persona.name,
        system_prompt: detail.ai_persona.system_prompt,
        avatar_url: detail.ai_persona.avatar_url,
      });
    } else {
      personaForm.resetFields();
    }
    setPersonaEditMode(true);
  };

  const handleSavePersona = async () => {
    try {
      if (!bookId) return;
      const values = await personaForm.validate();
      setSavingPersona(true);
      await setupBookPersona(bookId, values);
      Message.success('配置AI人设成功');
      setPersonaEditMode(false);
      fetchDetail();
    } catch (error) {
      // 错误已由 request 统一拦截并提示
    } finally {
      setSavingPersona(false);
    }
  };

  const handleAddChapter = () => {
    chapterForm.resetFields();
    setChapterAddMode(true);
  };

  const handleSaveChapter = async () => {
    try {
      if (!bookId) return;
      const values = await chapterForm.validate();
      setSavingChapter(true);
      await appendBookChapter(bookId, values);
      Message.success('追加章节成功');
      setChapterAddMode(false);
      fetchDetail();
    } catch (error) {
      // 错误已由 request 统一拦截并提示
    } finally {
      setSavingChapter(false);
    }
  };

  const handleSaveInfo = async () => {
    try {
      if (!bookId) return;
      const values = await form.validate();
      setSaving(true);
      await updateBook(bookId, values);
      Message.success('书籍信息已更新');
      setEditMode(false);
      fetchDetail();
      onUpdateSuccess();
    } catch (error) {
      // 错误已由 request 统一拦截并提示
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Drawer
      width={700}
      title="阅读与编辑"
      visible={visible}
      onCancel={onClose}
      footer={null}
      unmountOnExit
    >
      <Spin loading={loading} style={{ width: '100%', minHeight: 200 }}>
        {detail ? (
          <Tabs defaultActiveTab="1">
            <TabPane key="1" title="书籍信息">
              {!editMode ? (
                <div style={{ marginTop: 20 }}>
                  <Space style={{ marginBottom: 20 }}>
                    <Button type="primary" icon={<IconEdit />} onClick={() => setEditMode(true)}>
                      编辑书籍信息
                    </Button>
                  </Space>
                  <Typography>
                    <Title heading={3}>{detail.title}</Title>
                    <Paragraph>
                      <Text bold>作者：</Text> {detail.author} <br />
                      <Text bold>年代：</Text> {detail.year} <br />
                      <Text bold>坐标：</Text> {detail.latitude}, {detail.longitude}
                    </Paragraph>
                    {detail.description && (
                      <Paragraph>
                        <Text bold>描述：</Text> {detail.description}
                      </Paragraph>
                    )}
                  </Typography>
                </div>
              ) : (
                <div style={{ marginTop: 20 }}>
                  <Form form={form} layout="vertical">
                    <FormItem label="标题" field="title" rules={[{ required: true, message: '请输入书籍标题' }]}>
                      <Input placeholder="请输入书籍标题" />
                    </FormItem>
                    <FormItem label="作者" field="author" rules={[{ required: true, message: '请输入作者名称' }]}>
                      <Input placeholder="请输入作者名称" />
                    </FormItem>
                    <FormItem label="年份" field="year" rules={[{ required: true, message: '请输入年份' }]}>
                      <InputNumber placeholder="例如: 2024" />
                    </FormItem>
                    <FormItem label="纬度" field="latitude" rules={[{ required: true, message: '请输入纬度 (-90~90)' }]}>
                      <InputNumber placeholder="-90 ~ 90" min={-90} max={90} precision={6} />
                    </FormItem>
                    <FormItem label="经度" field="longitude" rules={[{ required: true, message: '请输入经度 (-180~180)' }]}>
                      <InputNumber placeholder="-180 ~ 180" min={-180} max={180} precision={6} />
                    </FormItem>
                    <FormItem label="封面图片" field="cover_url">
                      <Upload
                        accept="image/*"
                        listType="picture-card"
                        multiple={false}
                        limit={1}
                        customRequest={(option) => customUploadRequest(option, 'cover_url', form)}
                        fileList={
                          form.getFieldValue('cover_url')
                            ? [{ uid: '-1', url: detail.cover_url || undefined, status: 'done' }]
                            : []
                        }
                        onRemove={() => form.setFieldValue('cover_url', '')}
                      />
                    </FormItem>
                    <FormItem label="描述" field="description">
                      <Input.TextArea placeholder="请输入描述" autoSize={{ minRows: 2, maxRows: 6 }} />
                    </FormItem>
                    <FormItem>
                      <Space>
                        <Button type="primary" loading={saving} onClick={handleSaveInfo}>保存更改</Button>
                        <Button onClick={() => setEditMode(false)}>取消</Button>
                      </Space>
                    </FormItem>
                  </Form>
                </div>
              )}
            </TabPane>

            <TabPane key="2" title="AI 人设">
              {!personaEditMode ? (
                <div style={{ marginTop: 20 }}>
                  <Space style={{ marginBottom: 20 }}>
                    <Button type="primary" icon={<IconEdit />} onClick={handleEditPersona}>
                      配置/编辑人设
                    </Button>
                  </Space>
                  {detail.ai_persona ? (
                    <Typography>
                      <Title heading={5}>角色名: {detail.ai_persona.name}</Title>
                      <Divider />
                      <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{detail.ai_persona.system_prompt}</Paragraph>
                    </Typography>
                  ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-3)' }}>
                      暂未配置 AI 人设
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 20 }}>
                  <Form form={personaForm} layout="vertical">
                    <FormItem label="人设名称" field="name" rules={[{ required: true, message: '请输入人设名称' }]}>
                      <Input placeholder="请输入人设名称 (AI 角色名字)" />
                    </FormItem>
                    <FormItem
                      label="人设系统提示词 / 描述"
                      field="system_prompt"
                      rules={[{ required: true, message: '请输入人设系统提示词' }]}
                    >
                      <Input.TextArea
                        placeholder="请输入告诉 AI 它应该扮演什么角色的详细提示词"
                        autoSize={{ minRows: 4, maxRows: 10 }}
                      />
                    </FormItem>
                    <FormItem label="角色头像" field="avatar_url">
                      <Upload
                        accept="image/*"
                        listType="picture-card"
                        multiple={false}
                        limit={1}
                        customRequest={(option) => customUploadRequest(option, 'avatar_url', personaForm)}
                        fileList={
                          personaForm.getFieldValue('avatar_url')
                            ? [{ uid: '-1', url: detail.ai_persona?.avatar_url || undefined, status: 'done' }]
                            : []
                        }
                        onRemove={() => personaForm.setFieldValue('avatar_url', '')}
                      />
                    </FormItem>
                    <FormItem>
                      <Space>
                        <Button type="primary" loading={savingPersona} onClick={handleSavePersona}>保存配置</Button>
                        <Button onClick={() => setPersonaEditMode(false)}>取消</Button>
                      </Space>
                    </FormItem>
                  </Form>
                </div>
              )}
            </TabPane>

            <TabPane key="3" title={`章节内容 (${detail.contents?.length || 0})`}>
              {!chapterAddMode ? (
                <div style={{ marginTop: 20 }}>
                  <Space style={{ marginBottom: 20 }}>
                    <Button type="primary" icon={<IconPlus />} onClick={handleAddChapter}>
                      追加新章节
                    </Button>
                  </Space>
                  {detail.contents && detail.contents.length > 0 ? (
                    <div>
                      {detail.contents
                        .sort((a, b) => a.order - b.order)
                        .map((chapter, index) => (
                          <div key={chapter.id} style={{ marginBottom: 30 }}>
                            <Title heading={4}>
                              第 {index + 1} 章: {chapter.chapter_title}
                            </Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formatDate(chapter.created_at)} · 排序 {chapter.order}
                            </Text>
                            <Paragraph style={{ marginTop: 10, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                              {chapter.content}
                            </Paragraph>
                            <Divider />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-3)' }}>
                      暂无章节内容
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 20 }}>
                  <Form form={chapterForm} layout="vertical">
                    <FormItem
                      label="章节标题"
                      field="chapter_title"
                      rules={[{ required: true, message: '请输入章节标题' }]}
                    >
                      <Input placeholder="请输入章节标题" />
                    </FormItem>
                    <FormItem
                      label="章节正文"
                      field="content"
                      rules={[{ required: true, message: '请输入章节正文' }]}
                    >
                      <Input.TextArea placeholder="请输入章节正文" autoSize={{ minRows: 4, maxRows: 10 }} />
                    </FormItem>
                    <FormItem label="章节排序 (选填)" field="order">
                      <InputNumber placeholder="默认: 0" min={0} />
                    </FormItem>
                    <FormItem>
                      <Space>
                        <Button type="primary" loading={savingChapter} onClick={handleSaveChapter}>保存章节</Button>
                        <Button onClick={() => setChapterAddMode(false)}>取消</Button>
                      </Space>
                    </FormItem>
                  </Form>
                </div>
              )}
            </TabPane>
          </Tabs>
        ) : null}
      </Spin>
    </Drawer>
  );
};

export default BookDetailViewer;
