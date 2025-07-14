import React, { useEffect, useState } from 'react';

const TaskBoard = () => {
  const [groupedTasks, setGroupedTasks] = useState({});

  useEffect(() => {
    const fetchTasks = async () => {
      const res = await fetch('https://your-api-url/ScheduledEvents?$expand=ScheduledMaintenance');
      const data = await res.json();

      // ステップ2：当月 & 未完了フィルター
      const now = new Date();
      const thisMonth = now.getMonth();
      const filteredTasks = data.value.filter(task => {
        const due = new Date(task.DueDate);
        return due.getMonth() === thisMonth &&
               task.Status !== 'Finished';
      });

      // ステップ3：担当者ごとにグループ化
      const grouped = {};
      filteredTasks.forEach(task => {
        const assignee = task.AssigneesDisplayName || '未割当';
        if (!grouped[assignee]) grouped[assignee] = [];
        grouped[assignee].push(task);
      });

      setGroupedTasks(grouped); // Reactの状態に保存
    };

    fetchTasks();
  }, []);

  // 表示処理（仮）：
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">当月の未完了タスク</h1>
      <div className="grid grid-cols-3 gap-4">
        {Object.keys(groupedTasks).map(assignee => (
          <div key={assignee} className="bg-gray-100 p-2 rounded">
            <h2 className="font-semibold text-lg mb-2">{assignee}</h2>
            <ul>
              {groupedTasks[assignee].map(task => (
                <li key={task.EventId} className="mb-1 border p-1 rounded bg-white">
                  <strong>{task.ScheduledMaintenance.Title}</strong><br />
                  機械: {task.MachineName}<br />
                  期限: {new Date(task.DueDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;
