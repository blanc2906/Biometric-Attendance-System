import { message, Modal, notification } from "antd";
import React, { useEffect } from "react";
import { Form, Input } from "antd";
import { createNewUser } from "../../../services/api";

type UserModalCreateProps = {
  isModalCreateOpen: boolean;
  setIsModalCreateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchUser: () => Promise<void>;
};

type UserFormData = {
  name: string;
  id_nvien: string;
  finger_id: number;
};

export default function UserModalCreate({
  isModalCreateOpen,
  setIsModalCreateOpen,
  fetchUser,
}: UserModalCreateProps) {
  const [form] = Form.useForm<UserFormData>();

  // Reset form khi modal mở
  useEffect(() => {
    if (isModalCreateOpen) {
      form.resetFields();
    }
  }, [isModalCreateOpen, form]);

  const handleFinishFormCreateUser = async (values: UserFormData) => {
    try {
      const res = await createNewUser(values);

      // Đóng modal trước khi reset form
      setIsModalCreateOpen(false);

      // Reset form sau khi đóng modal
      form.resetFields();

      message.success("Create user successful!");

      // Fetch lại danh sách người dùng sau khi tạo
      await fetchUser();
    } catch (error: any) {
      notification.error({
        message: "An error has occurred",
        description: error.response?.data?.message || "Create user failed",
      });
    }
  };

  const handleCancel = () => {
    // Reset form trước khi đóng modal
    form.resetFields();
    setIsModalCreateOpen(false);
  };

  return (
    <Modal
      title="Create user"
      open={isModalCreateOpen}
      onOk={async () => {
        form.submit(); // Gọi form.submit ở đây sẽ trigger sự kiện onFinish
        setIsModalCreateOpen(false);
      }}
      onCancel={handleCancel}
      okText="Create"
      cancelText="Cancel"
      destroyOnClose={true}
    >
      <Form<UserFormData>
        form={form}
        onFinish={handleFinishFormCreateUser} // Gọi hàm xử lý submit ở đây
        autoComplete="off"
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please input name!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Employee ID"
          name="id_nvien"
          rules={[{ required: true, message: "Please input employee ID!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Finger ID"
          name="finger_id"
          rules={[{ required: true, message: "Please input finger ID!" }]}
        >
          <Input type="number" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
