import React, { useEffect, useState } from "react";
import { Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { getUserLogs, UserLog } from "../../../services/api";

export default function ListUserLogs() {
  const [logs, setLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserLogs = async () => {
      try {
        setLoading(true);
        const response = await getUserLogs();
        setLogs(response.data);
      } catch (error: any) {
        message.error("Failed to fetch user logs");
      } finally {
        setLoading(false);
      }
    };

    fetchUserLogs();
  }, []);

  const columns: ColumnsType<UserLog> = [
    {
      title: "User ID",
      dataIndex: "user_id",
      key: "user_id",
      width: "15%",
      sorter: (a, b) => a.user_id.localeCompare(b.user_id),
    },
    {
      title: "User Name",
      dataIndex: "user_name",
      key: "user_name",
      width: "20%",
      sorter: (a, b) => a.user_name.localeCompare(b.user_name),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "20%",
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: "Time In",
      dataIndex: "time_in",
      key: "time_in",
      width: "20%",
      sorter: (a, b) => a.time_in.localeCompare(b.time_in),
    },
    {
      title: "Time Out",
      dataIndex: "time_out",
      key: "time_out",
      width: "20%",
      sorter: (a, b) => a.time_out.localeCompare(b.time_out),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>User Attendance Logs</h2>
      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />
    </div>
  );
}
