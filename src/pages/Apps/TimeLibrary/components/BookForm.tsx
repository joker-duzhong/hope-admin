import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Message, Upload } from '@arco-design/web-react';
import type { Book, BookCreateParams } from '../types';
import { addBook, updateBook } from '../api';
import { uploadFiles } from '@/utils/upload';

const FormItem = Form.Item;
const TextArea = Input.TextArea;

interface BookFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  editData?: Book | null;
}

const BookForm: React.FC<BookFormProps> = ({ visible, onCancel, onSuccess, editData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!editData;

  useEffect(() => {
    if (visible && editData) {
      form.setFieldsValue({
        title: editData.title,
        author: editData.author,
        year: editData.year,
        latitude: editData.latitude,
        longitude: editData.longitude,
        cover_url: editData.cover_url,
        description: editData.description,
      });
    } else {
      form.resetFields();
    }
  }, [visible, editData, form]);

  const onOk = async () => {
    try {
      const values = await form.validate();
      setLoading(true);
      if (isEdit) {
        await updateBook(editData.id, values as any);
        Message.success('更新成功');
      } else {
        await addBook(values as BookCreateParams);
        Message.success('添加成功');
      }
      onSuccess();
    } catch (error) {
      // 校验错误无需处理，网络错误已交由 request 拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const customRequest = async (option: any) => {
    const { file, onProgress, onSuccess, onError } = option;
    try {
      onProgress(20);
      const resources = await uploadFiles(file);
      onProgress(100);
      if (resources && resources.length > 0) {
        // 保存的是资源的 id
        form.setFieldValue('cover_url', resources[0].id);
        onSuccess(resources[0]);
      } else {
        throw new Error('上传失败，未获取到资源 ID');
      }
    } catch (error: any) {
      onError(error);
      Message.error(error.message || '上传失败');
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑书籍' : '录入书籍'}
      visible={visible}
      confirmLoading={loading}
      onOk={onOk}
      onCancel={onCancel}
      autoFocus={false}
      focusLock={true}
      unmountOnExit={true}
    >
      <Form form={form} layout="vertical">
        <FormItem label="标题" field="title" rules={[{ required: true, message: '请输入书籍标题' }]}>
          <Input placeholder="请输入书籍标题" />
        </FormItem>
        <FormItem label="作者" field="author" rules={[{ required: true, message: '请输入作者名称' }]}>
          <Input placeholder="请输入作者名称" />
        </FormItem>
        <FormItem label="年份 (公元)" field="year" rules={[{ required: true, message: '请输入年份' }]}>
          <InputNumber placeholder="例如: 2024" />
        </FormItem>
        <FormItem label="坐标 - 纬度" field="latitude" rules={[{ required: true, message: '请输入纬度 (-90~90)' }]}>
          <InputNumber placeholder="-90 ~ 90" min={-90} max={90} precision={6} />
        </FormItem>
        <FormItem label="坐标 - 经度" field="longitude" rules={[{ required: true, message: '请输入经度 (-180~180)' }]}>
          <InputNumber placeholder="-180 ~ 180" min={-180} max={180} precision={6} />
        </FormItem>
        <FormItem label="封面图片" field="cover_url">
          <Upload
            accept="image/*"
            listType="picture-card"
            multiple={false}
            customRequest={customRequest}
            showUploadList={{
              reuploadIcon: true,
              cancelIcon: true,
            }}
            limit={1}
            onRemove={() => {
              form.setFieldValue('cover_url', '');
            }}
          />
        </FormItem>
        <FormItem label="描述" field="description">
          <TextArea placeholder="请输入描述" autoSize={{ minRows: 2, maxRows: 6 }} />
        </FormItem>
      </Form>
    </Modal>
  );
};

export default BookForm;
