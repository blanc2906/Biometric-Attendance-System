import React, { useState } from "react";
import {
  Button,
  Col,
  Row,
  Table,
  Space,
  message,
  Popconfirm,
  Modal,
  Upload,
  Image,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { ColumnsType } from "antd/es/table";
import { useEffect } from "react";
import {
  deleteUser,
  getUsers,
  addFaceToUser,
  User,
  initialCreateUser,
} from "../../../services/api";
import { LiaFileExportSolid } from "react-icons/lia";
import { IoCreateOutline } from "react-icons/io5";
import { RxReload } from "react-icons/rx";
import UserModalCreate from "./UserModalCreate";
import Loading from "../../Loading/Loading";
import ViewUserDetail from "./ViewUserDetail";
import { CiFaceSmile } from "react-icons/ci";
import { BiSolidUserDetail } from "react-icons/bi";
import { MdOutlineDelete } from "react-icons/md";

export default function ListUsers() {
  const [listUser, setListUser] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);
  const [isModalAddFaceOpen, setIsModalAddFaceOpen] = useState<boolean>(false);
  const [uploadingUserId, setUploadingUserId] = useState<string | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const users = await getUsers();
      if (users) {
        setListUser(users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Không thể tải danh sách người dùng");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteUser(id);
      message.success("Xóa người dùng thành công");
      setListUser((prevUsers) => prevUsers.filter((user) => user._id !== id));
    } catch (error) {
      console.error("Lỗi xóa người dùng:", error);
      message.error("Xóa người dùng thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUserDetail = (user: User) => {
    setSelectedUser(user);
    setOpenViewDetail(true);
  };

  const exportExcelFile = () => {
    window.location.href = "http://localhost:3000/excel-export/download";
  };

  const handleAddFace = async () => {
    if (!uploadingUserId || fileList.length === 0) {
      message.error("Vui lòng tải lên một ảnh khuôn mặt");
      return;
    }

    const file = fileList[0]; // Lấy file đầu tiên từ fileList
    console.log("File to be uploaded:", file);

    if (!(file instanceof File)) {
      message.error("Tệp không hợp lệ");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    // Gửi formData tới API
    setIsLoading(true);
    try {
      const res = await addFaceToUser(uploadingUserId, formData);
      if (res) {
        message.success("Face added successfully");
        setIsModalAddFaceOpen(false);
        setFileList([]);
        setPreviewUrl(null);
        fetchUser();
      }
    } catch (error: any) {
      if (error.response?.data?.error?.includes("already registered")) {
        message.error("This face is already registered for another user");
      } else {
        message.error("Failed to add face. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add preview handler
  const handlePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const columns: ColumnsType<User> = [
    {
      title: "Employee ID",
      dataIndex: "id_nvien",
      key: "id_nvien",
      width: "15%",
      sorter: (a, b) => a.id_nvien - b.id_nvien, // Sắp xếp theo Employee ID
      sortDirections: ["descend", "ascend"], // Cung cấp hai chiều sắp xếp
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: "30%",
      sorter: (a, b) => a.name.localeCompare(b.name), // Sắp xếp theo tên
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "Finger ID",
      dataIndex: "finger_id",
      key: "finger_id",
      width: "15%",
      sorter: (a, b) => a.finger_id - b.finger_id, // Sắp xếp theo Finger ID
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "Face",
      dataIndex: "image_path",
      key: "image_path",
      width: "30%",
      render: (imagePath) => (
        <Image
          src={imagePath}
          alt="Face"
          style={{ width: 100, height: 100, objectFit: "cover" }}
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            onClick={() => {
              setUploadingUserId(record._id || null);
              setIsModalAddFaceOpen(true);
            }}
          >
            <CiFaceSmile />
          </Button>
          <Button onClick={() => handleViewUserDetail(record)}>
            <BiSolidUserDetail />
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDeleteUser(record._id || "")}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="primary" danger>
              <MdOutlineDelete />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderHeaderTable = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>Table list users</span>
      <span style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <Button
          icon={<LiaFileExportSolid />}
          type="primary"
          onClick={exportExcelFile}
        >
          Export
        </Button>
        <Button
          icon={<IoCreateOutline />}
          type="primary"
          onClick={async () => {
            await initialCreateUser();

            setIsModalCreateOpen(true);
          }}
        >
          Create
        </Button>
        <Button icon={<RxReload />} onClick={fetchUser}></Button>
      </span>
    </div>
  );

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <Row gutter={[20, 20]}>
          <Col span={24}>
            <h2 style={{ marginBottom: 20 }}>Manage users</h2>
            <Table
              dataSource={listUser}
              columns={columns}
              rowKey="_id"
              loading={isLoading}
              title={() => renderHeaderTable()}
            />
          </Col>
        </Row>
      )}

      <ViewUserDetail
        openViewDetail={openViewDetail}
        setOpenViewDetail={setOpenViewDetail}
        dataViewDetail={selectedUser}
        setDataViewDetail={setSelectedUser}
      />

      <UserModalCreate
        isModalCreateOpen={isModalCreateOpen}
        setIsModalCreateOpen={setIsModalCreateOpen}
        fetchUser={fetchUser}
      />

      {/* <Modal
        title="Add Face"
        open={isModalAddFaceOpen}
        onCancel={() => setIsModalAddFaceOpen(false)}
        onOk={handleAddFace}
        okText="Submit"
        cancelText="Cancel"
      >
        <Upload
          accept="image/*"
          beforeUpload={(file) => {
            setFileList([file]);
            return false;
          }}
          fileList={fileList}
          onRemove={() => setFileList([])}
        >
          <Button icon={<UploadOutlined />}>Upload Face Image</Button>
        </Upload>
      </Modal> */}

      <Modal
        title="Add Face"
        open={isModalAddFaceOpen}
        onCancel={() => {
          setIsModalAddFaceOpen(false);
          setPreviewUrl(null);
          setFileList([]);
        }}
        onOk={handleAddFace}
        okText="Submit"
        cancelText="Cancel"
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {previewUrl && (
            <Image
              src={previewUrl}
              alt="Preview"
              style={{
                width: "100%",
                maxHeight: "300px",
                objectFit: "contain",
              }}
            />
          )}
          <Upload
            accept="image/*"
            beforeUpload={(file) => {
              setFileList([file]);
              handlePreview(file);
              return false;
            }}
            fileList={fileList}
            onRemove={() => {
              setFileList([]);
              setPreviewUrl(null);
            }}
          >
            <Button icon={<UploadOutlined />}>Upload Face Image</Button>
          </Upload>
        </Space>
      </Modal>
    </>
  );
}
