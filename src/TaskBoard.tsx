import React, { useEffect, useState } from 'react';
import noTaskImage from './image/87a88a59-d062-4e5d-86f0-f2568db58da1.png';
import styles from './TaskBoard.module.css';

// 型定義
type ScheduledMaintenance = {
  ID: number;
  Title: string;
  CheckItem: string | null;
};

type ScheduledEvent = {
  EventId: number;
  DueDate: string;
  Status: string;
  AssigneesDisplayName: string | null;
  AssigneesGroupName: string | null;
  MachineName?: string;
  SiteName?: string;
  Sites?: {
    SiteName: string;
    SiteNameCaption: string;
  };
  ScheduledMaintenance: ScheduledMaintenance;
};

type Team = {
  ID: number;
  Name: string;
  Team_Sites: {
    SiteNameCaption: string;
  };
};

type GroupedTasks = Record<string, ScheduledEvent[]>;
type CarouselProps = {
  groupedTasks: GroupedTasks;
  onTaskClick: (task: ScheduledEvent) => void;
};

const TaskBoard: React.FC = () => {
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sites, setSites] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('全て');
  const [selectedTask, setSelectedTask] = useState<ScheduledEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleOpenDescription = () => {
    window.open('/description.md', '_blank');
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('https://wminkbl9l6.execute-api.us-west-2.amazonaws.com/prod/team');
      const rawData = await response.json();
      const parsed = JSON.parse(rawData.body);

      const siteSet = new Set<string>();
      const validTeams = parsed.value.filter((team: Team) => team.Team_Sites?.SiteNameCaption);
      validTeams.forEach((team: Team) => siteSet.add(team.Team_Sites.SiteNameCaption));

      setSites(Array.from(siteSet));
      setTeams(validTeams);

      if (siteSet.size > 0 && !sites.includes(selectedSite)) {
        setSelectedSite(Array.from(siteSet)[0]);
      }
    } catch (err: any) {
      console.error('fetchTeams エラー:', err);
      setError(err.message || 'チーム情報取得に失敗しました');
    }
  };

  const fetchTasks = async () => {
    if (!selectedSite) return;
    setLoading(true);
    try {
      const nowDate = new Date();
      const nowMonth = nowDate.getMonth() + 1;
      const nowYear = nowDate.getFullYear();

      const siteNameParam = encodeURIComponent(selectedSite);
      const url = `https://wminkbl9l6.execute-api.us-west-2.amazonaws.com/prod/tasks?SiteName=${siteNameParam}&Month=${nowMonth}&Year=${nowYear}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`APIエラー: ステータスコード ${response.status}`);

      const data = await response.json();
      const filteredTasks: ScheduledEvent[] = data.value.filter((task: ScheduledEvent) => {
        const due = new Date(task.DueDate);
        const isThisMonth = due.getMonth() === nowDate.getMonth() && due.getFullYear() === nowDate.getFullYear();
        const isNotFinished = task.Status !== 'Finished';
        const siteNameCaption = task.Sites?.SiteNameCaption || task.SiteName || '';
        const isSameSite = siteNameCaption === selectedSite;
        const isSameTeam = selectedTeam === '全て' || task.AssigneesGroupName === selectedTeam;
        return isThisMonth && isNotFinished && isSameSite && isSameTeam;
      });

      const grouped: GroupedTasks = {};
      filteredTasks.forEach(task => {
        const assignee = task.AssigneesDisplayName || '未割当';
        if (!grouped[assignee]) grouped[assignee] = [];
        grouped[assignee].push(task);
      });

      setGroupedTasks(grouped);
    } catch (err: any) {
      console.error('fetchTasks エラー:', err);
      setError(err.message || '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    const intervalId = setInterval(fetchTeams, 3600000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchTasks();
    const intervalId = setInterval(fetchTasks, 3600000);
    return () => clearInterval(intervalId);
  }, [selectedSite, selectedTeam]);

  const now = new Date();
  const monthTitle = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  return (
    <div className={styles.root}>
      <button onClick={handleOpenDescription} className={styles.descriptionButton}>画面説明</button>
      <h1 className={styles.title}>当月の未完了タスク（{monthTitle}）</h1>

      <div className={styles.selectRow}>
        <label className={styles.siteLabel}>
          拠点選択：
          <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)} className={styles.select}>
            {sites.map(site => <option key={site} value={site}>{site}</option>)}
          </select>
        </label>
        <label className={styles.teamLabel}>
          チーム選択：
          <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className={styles.select}>
            <option value="全て">全て</option>
            {teams.filter(team => team.Team_Sites.SiteNameCaption === selectedSite).map(team => (
              <option key={team.ID} value={team.Name}>{team.Name}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className={styles.loading}>読み込み中...</p>}
      {error && <p className={styles.error}>エラーが発生しました：{error}</p>}

      {!loading && !error && (
        Object.keys(groupedTasks).length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '50vh' }}>
            <img src={noTaskImage} alt="タスクなし" style={{ maxWidth: 480, width: '60vw', marginBottom: 32, opacity: 0.92 }} />
            <div style={{ color: '#888', fontSize: 22 }}>今月の未完了タスクはありません</div>
          </div>
        ) : (
          <>
            <div className={styles.mainContent}>
              <Carousel groupedTasks={groupedTasks} onTaskClick={task => { setSelectedTask(task); setShowModal(true); }} />
              <SummaryPanel groupedTasks={groupedTasks} />
            </div>
            {showModal && selectedTask && (
              <TaskDetailModal task={selectedTask} onClose={() => setShowModal(false)} />
            )}
          </>
        )
      )}
    </div>
  );
};

export default TaskBoard;

// TaskDetailModal
const TaskDetailModal: React.FC<{ task: ScheduledEvent; onClose: () => void }> = ({ task, onClose }) => {
  const checkItem = task.ScheduledMaintenance?.CheckItem ?? '';
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#232526', color: '#fff', borderRadius: 12, padding: '2rem', maxWidth: 400, position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>×</button>
        <h2 style={{ color: '#00c6fb', fontSize: '1.3rem', textAlign: 'center', marginBottom: 16 }}>{task.ScheduledMaintenance?.Title || '(タイトルなし)'}</h2>
        <div><strong>機械名：</strong>{task.MachineName || '(設備名なし)'}</div>
        <div><strong>点検項目：</strong>{checkItem || 'ー'}</div>
        <div><strong>期限：</strong>{new Date(task.DueDate).toLocaleDateString()}</div>
        <div><strong>担当者：</strong>{task.AssigneesDisplayName || '未割当'}</div>
        <div><strong>チーム：</strong>{task.AssigneesGroupName || '未所属'}</div>
        <div><strong>拠点：</strong>{task.Sites?.SiteNameCaption || task.SiteName || 'ー'}</div>
        <div><strong>ステータス：</strong>{task.Status}</div>
        <div style={{ fontSize: 12, color: '#b2bec3', marginTop: 18, textAlign: 'center' }}>画面外クリックまたは「×」で閉じる</div>
      </div>
    </div>
  );
};

// SummaryPanel
const SummaryPanel: React.FC<{ groupedTasks: GroupedTasks }> = ({ groupedTasks }) => (
  <div className={styles.summaryPanel}>
    <h3 className={styles.summaryTitle}>担当者サマリー</h3>
    <ul className={styles.summaryList}>
      {Object.entries(groupedTasks).map(([assignee, tasks]) => (
        <li key={assignee} className={styles.summaryAssignee}>
          <span className={styles.summaryAssigneeName}>{assignee}</span><br />
          <span className={styles.summaryTaskCount}>{tasks.length}件</span>
        </li>
      ))}
    </ul>
  </div>
);

// Carousel
const Carousel: React.FC<CarouselProps> = ({ groupedTasks, onTaskClick }) => {
  const assignees = Object.keys(groupedTasks);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxVisible, setMaxVisible] = useState(3);

  const getRemainingWidth = () => {
    const summaryPanel = document.querySelector(`.${styles.summaryPanel}`) as HTMLElement;
    const summaryPanelWidth = summaryPanel ? summaryPanel.offsetWidth : 0;
    return window.innerWidth - summaryPanelWidth;
  };

  const getMaxVisible = () => {
    const remainingWidth = getRemainingWidth();
    const cardWidth = 280 + 38.4;
    return Math.floor(remainingWidth / cardWidth);
  };

  useEffect(() => {
    const handleResize = () => setMaxVisible(getMaxVisible());
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [assignees.length, maxVisible]);

  const visibleAssignees = assignees.slice(currentIndex, currentIndex + maxVisible);
  const totalPages = Math.ceil(assignees.length / maxVisible);
  const currentPage = Math.floor(currentIndex / maxVisible) + 1;

  return (
    <div className={styles.carousel}>
      {assignees.length > maxVisible && (
        <div className={styles.carouselNavRow}>
          <button
            onClick={() => setCurrentIndex(prev => Math.max(prev - maxVisible, 0))}
            disabled={currentIndex === 0}
            className={styles.carouselButton}
          >◀</button>
          <span className={styles.carouselPage}>{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentIndex(prev => Math.min(prev + maxVisible, assignees.length - maxVisible))}
            disabled={currentIndex >= assignees.length - maxVisible}
            className={styles.carouselButton}
          >▶</button>
        </div>
      )}
      <div className={styles.cardList} style={{ gridTemplateColumns: `repeat(${maxVisible}, 1fr)` }}>
        {visibleAssignees.map(assignee => (
          <div key={assignee} className={styles.card}>
            <h2 className={styles.cardTitle}>{assignee}</h2>
            <ul className={styles.taskList}>
              {groupedTasks[assignee].map(task => (
                <li key={task.EventId} className={styles.taskItem} onClick={() => onTaskClick(task)} title="クリックで詳細">
                  <span className={styles.machineName}>{task.MachineName || '(設備名なし)'}</span><br />
                  <span className={styles.taskTitle}>{task.ScheduledMaintenance?.Title || '(タイトルなし)'}</span><br />
                  <span className={styles.checkItem}>点検項目: {task.ScheduledMaintenance?.CheckItem ?? 'ー'}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
