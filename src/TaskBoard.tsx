import React, { useEffect, useState } from 'react';
import noTaskImage from './image/87a88a59-d062-4e5d-86f0-f2568db58da1.png';
import styles from './TaskBoard.module.css';
// 型定義
type ScheduledMaintenance = {
  ID: number;
  Title: string;
  CheckItem: string;
};

type ScheduledEvent = {
  EventId: number;
  DueDate: string;
  Status: string;
  AssigneesDisplayName: string | null;
  AssigneesGroupName: string | null;
  MachineName: string;
  SiteName: string;
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

const TaskBoard: React.FC = () => {
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sites, setSites] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('全て');
  // 追加: モーダル用 state
  const [selectedTask, setSelectedTask] = useState<ScheduledEvent | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 説明.mdボタン
  const handleOpenDescription = () => {
    window.open('/description.md', '_blank');
  };

<<<<<<< HEAD
  // --- fetchTeamsを外に出して再利用可能に ---
  const fetchTeams = async () => {
    try {
      const response = await fetch(
        'https://wminkbl9l6.execute-api.us-west-2.amazonaws.com/prod/team'
      );
      const rawData  = await response.json();
      const parsed = JSON.parse(rawData.body);

      const siteSet = new Set<string>();
      const validTeams = parsed.value.filter((team: Team) => team.Team_Sites?.SiteNameCaption);
      validTeams.forEach((team: Team) => siteSet.add(team.Team_Sites.SiteNameCaption));

      setSites(Array.from(siteSet));
      setTeams(validTeams);
      if (siteSet.size > 0 && !sites.includes(selectedSite)) {
        setSelectedSite(Array.from(siteSet)[0]);
      }
      // 選択中のチームは保持
      // setSelectedTeam('全て');
    } catch (err: any) {
      console.error('fetchTeams エラー:', err);
      setError(err.message || 'チーム情報取得に失敗しました');
    }
  };

  useEffect(() => {
    fetchTeams();
    // 1時間ごとに自動更新
    const intervalId = setInterval(() => {
      fetchTeams();
    }, 3600000); // 1時間 = 3600000ms
    return () => clearInterval(intervalId);
  }, []);

  // --- fetchTasksを外に出して再利用可能に ---
  const fetchTasks = async () => {
    if (!selectedSite) return;
    setLoading(true);
    try {
      const nowDate = new Date();
      const nowMonth = nowDate.getMonth() + 1; // JavaScriptは0-indexのため+1
      const nowYear = nowDate.getFullYear();

      const siteNameParam = encodeURIComponent(selectedSite); // '北本' → '%E5%8C%97%E6%9C%AC'
      const url = `https://wminkbl9l6.execute-api.us-west-2.amazonaws.com/prod/tasks?SiteName=${siteNameParam}&Month=${nowMonth}&Year=${nowYear}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`APIエラー: ステータスコード ${response.status}`);
      }

      const rawData2 = await response.json();
      //const data = JSON.parse(rawData2.body);
      const data = rawData2;
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const filteredTasks: ScheduledEvent[] = data.value.filter((task: ScheduledEvent) => {
        const due = new Date(task.DueDate);
        const isThisMonth = due.getMonth() === thisMonth && due.getFullYear() === thisYear;
        const isNotFinished = task.Status !== 'Finished';
        const isSameSite = task.SiteName === selectedSite;
        const isSameTeam = selectedTeam === '全て' || task.AssigneesGroupName === selectedTeam;
        return isThisMonth && isNotFinished && isSameSite && isSameTeam;
      });

      const grouped: GroupedTasks = {};
      filteredTasks.forEach((task) => {
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
    fetchTasks();
    // 1時間ごとに自動更新
    const intervalId = setInterval(() => {
      fetchTasks();
    }, 3600000); // 1時間 = 3600000ms
    return () => clearInterval(intervalId);
=======
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          'https://wminkbl9l6.execute-api.us-west-2.amazonaws.com/prod/team'
        );
        const rawData  = await response.json();
        const parsed = JSON.parse(rawData.body);

        const siteSet = new Set<string>();
        const validTeams = parsed.value.filter((team: Team) => team.Team_Sites?.SiteNameCaption);
        validTeams.forEach((team: Team) => siteSet.add(team.Team_Sites.SiteNameCaption));

        setSites(Array.from(siteSet));
        setTeams(validTeams);
        if (siteSet.size > 0) {
          setSelectedSite(Array.from(siteSet)[0]);
        }
        setSelectedTeam('全て');
      } catch (err: any) {
        console.error('fetchTeams エラー:', err);
        setError(err.message || 'チーム情報取得に失敗しました');
      }
    };
    fetchTeams();
  }, []);

  useEffect(() => {
    if (!selectedSite) return;
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const nowDate = new Date();
        const nowMonth = nowDate.getMonth() + 1; // JavaScriptは0-indexのため+1
        const nowYear = nowDate.getFullYear();

        const siteNameParam = encodeURIComponent(selectedSite); // '北本' → '%E5%8C%97%E6%9C%AC'
        const url = `https://wminkbl9l6.execute-api.us-west-2.amazonaws.com/prod/tasks?SiteName=${siteNameParam}&Month=${nowMonth}&Year=${nowYear}`;
        const response = await fetch(url);


        if (!response.ok) {
          throw new Error(`APIエラー: ステータスコード ${response.status}`);
        }

        const rawData2 = await response.json();
        //const data = JSON.parse(rawData2.body);
        const data = rawData2;
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const filteredTasks: ScheduledEvent[] = data.value.filter((task: ScheduledEvent) => {
          const due = new Date(task.DueDate);
          const isThisMonth = due.getMonth() === thisMonth && due.getFullYear() === thisYear;
          const isNotFinished = task.Status !== 'Finished';
          const isSameSite = task.SiteName === selectedSite;
          const isSameTeam = selectedTeam === '全て' || task.AssigneesGroupName === selectedTeam;
          return isThisMonth && isNotFinished && isSameSite && isSameTeam;
        });

        const grouped: GroupedTasks = {};
        filteredTasks.forEach((task) => {
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
    fetchTasks();
>>>>>>> 888b532cfc5a1ba9038994c2e8ad367e48249d60
  }, [selectedSite, selectedTeam]);

  // 期限（今月）をページタイトルに追加
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  const monthTitle = `${thisYear}年${thisMonth}月`;

  return (
    <div className={styles.root}>
      {/* 画面説明ボタン */}
      <button
        onClick={handleOpenDescription}
        className={styles.descriptionButton}
      >
        画面説明
      </button>

      <h1 className={styles.title}>
        当月の未完了タスク（{monthTitle}）
      </h1>

      <div className={styles.selectRow}>
        <label className={styles.siteLabel}>
          拠点選択：
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className={styles.select}
          >
            {sites.map(site => (
              <option key={site} value={site}>{site}</option>
            ))}
          </select>
        </label>

        <label className={styles.teamLabel}>
          チーム選択：
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className={styles.select}
          >
            <option value="全て">全て</option>
            {teams
              .filter(team => team.Team_Sites.SiteNameCaption === selectedSite)
              .map(team => (
                <option key={team.ID} value={team.Name}>{team.Name}</option>
              ))}
          </select>
        </label>
      </div>

      {loading && <p className={styles.loading}>読み込み中...</p>}
      {error && <p className={styles.error}>エラーが発生しました：{error}</p>}

      {!loading && !error && (
        <>
          {Object.keys(groupedTasks).length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', width: '100%' }}>
              <img src={noTaskImage} alt="タスクなし" style={{ maxWidth: 480, width: '60vw', marginBottom: 32, opacity: 0.92, transition: 'all 0.3s' }} />
              <div style={{ color: '#888', fontSize: 22, textAlign: 'center', fontWeight: 500 }}>今月の未完了タスクはありません</div>
            </div>
          ) : (
            <>
<<<<<<< HEAD
            <div className={styles.mainContent}>
              <Carousel groupedTasks={groupedTasks} onTaskClick={(task) => { setSelectedTask(task); setShowModal(true); }} />
              <SummaryPanel groupedTasks={groupedTasks} />
            </div>
=======
              <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
                <Carousel groupedTasks={groupedTasks} onTaskClick={(task) => { setSelectedTask(task); setShowModal(true); }} />
                <SummaryPanel groupedTasks={groupedTasks} />
              </div>
>>>>>>> 888b532cfc5a1ba9038994c2e8ad367e48249d60
              {showModal && selectedTask && (
                <TaskDetailModal task={selectedTask} onClose={() => setShowModal(false)} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

type CarouselProps = {
  groupedTasks: GroupedTasks;
  onTaskClick: (task: ScheduledEvent) => void;
};

const Carousel: React.FC<CarouselProps> = ({ groupedTasks, onTaskClick }) => {
  const assignees = Object.keys(groupedTasks);
  const [currentIndex, setCurrentIndex] = useState(0);

<<<<<<< HEAD
  // 画面幅から最大表示数を計算（例: 1列260px+gap）
  const getMaxVisible = () => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width < 600) return 1;
    if (width < 900) return 2;
    if (width < 1200) return 3;
    if (width < 1500) return 4;
    return 5;
  };
  const [maxVisible, setMaxVisible] = useState(getMaxVisible());

  React.useEffect(() => {
    const handleResize = () => setMaxVisible(getMaxVisible());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleAssignees = assignees.length <= maxVisible
    ? assignees
    : assignees.slice(currentIndex, currentIndex + maxVisible);

  // maxVisible人ずつページ送り
  const handlePrev = () => setCurrentIndex((prev) => Math.max(prev - maxVisible, 0));
  const handleNext = () => setCurrentIndex((prev) => Math.min(prev + maxVisible, assignees.length - maxVisible));

  React.useEffect(() => {
    // assignees数やmaxVisibleが変わったらindexをリセット
    setCurrentIndex(0);
  }, [assignees.length, maxVisible]);

  // ページ数計算（maxVisible人ずつ送る）
  const totalPages = assignees.length <= maxVisible ? 1 : Math.ceil(assignees.length / maxVisible);
  const currentPage = assignees.length <= maxVisible ? 1 : Math.floor(currentIndex / maxVisible) + 1;

  return (
    <div className={styles.carousel}>
      {/* ボタンとページ番号をカードリストの上・中央に配置 */}
      {assignees.length > maxVisible && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 16, height: 48 }}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={styles.carouselButton}
            style={{ position: 'static', height: 48, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '48px' }}
          >◀</button>
          <span style={{
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            background: 'rgba(35,37,38,0.85)',
            borderRadius: 8,
            height: 48,
            minWidth: 60,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '48px',
            padding: '0 16px',
            marginTop: '-50px'
          }}>{currentPage} / {totalPages}</span>
          <button
            onClick={handleNext}
            disabled={currentIndex >= assignees.length - maxVisible}
            className={styles.carouselButton}
            style={{ position: 'static', height: 48, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '48px' }}
          >▶</button>
        </div>
      )}
      <div className={styles.cardList}>
        {visibleAssignees.map((assignee) => {
          const tasks = groupedTasks[assignee];
          return (
            <div
              key={assignee}
              className={styles.card}
            >
              <h2 className={styles.cardTitle}>
                {assignee}
              </h2>
              <ul className={styles.taskList}>
                {tasks.map((task) => {
                  const checkItem = task.ScheduledMaintenance?.CheckItem ?? null;
                  let checkItemDisplay = 'ー';
                  if (checkItem) {
                    const parts = checkItem.split(':');
                    checkItemDisplay = parts.length > 1 ? parts[1].trim() : checkItem;
                  }
                  return (
                    <li
                      key={task.EventId}
                      className={styles.taskItem}
                      onClick={() => onTaskClick(task)}
                      style={{ cursor: 'pointer' }}
                      title="クリックで詳細"
                    >
                      <span className={styles.machineName}>{task.MachineName || '(設備名なし)'}</span><br />
                      <span className={styles.taskTitle}>{task.ScheduledMaintenance?.Title || '(タイトルなし)'}</span><br />
                      <span className={styles.checkItem}>点検項目: {checkItemDisplay}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
=======
  const visibleAssignees = assignees.length <= 4
    ? assignees
    : assignees.slice(currentIndex, currentIndex + 4);

  const handlePrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));
  const handleNext = () => setCurrentIndex((prev) => Math.min(prev + 1, assignees.length - 4));

  return (
    <div className={styles.carousel}>
      {assignees.length > 4 && (
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`${styles.carouselButton} ${styles.carouselButtonLeft}`}
        >◀</button>
      )}
      <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
        {visibleAssignees.map((assignee) => (
          <div
            key={assignee}
            className={styles.card}
          >
            <h2 className={styles.cardTitle}>
              {assignee}
            </h2>
            <ul className={styles.taskList}>
              {groupedTasks[assignee].map((task) => {
                const checkItem = task.ScheduledMaintenance?.CheckItem ?? null;
                let checkItemDisplay = 'ー';
                if (checkItem) {
                  const parts = checkItem.split(':');
                  checkItemDisplay = parts.length > 1 ? parts[1].trim() : checkItem;
                }
                return (
                  <li
                    key={task.EventId}
                    className={styles.taskItem}
                    onClick={() => onTaskClick(task)}
                    style={{ cursor: 'pointer' }}
                    title="クリックで詳細"
                  >
                    <span className={styles.machineName}>{task.MachineName || '(設備名なし)'}</span><br />
                    <span className={styles.taskTitle}>{task.ScheduledMaintenance?.Title || '(タイトルなし)'}</span><br />
                    <span className={styles.checkItem}>点検項目: {checkItemDisplay}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {assignees.length > 4 && (
        <button
          onClick={handleNext}
          disabled={currentIndex >= assignees.length - 4}
          className={`${styles.carouselButton} ${styles.carouselButtonRight}`}
        >▶</button>
      )}
>>>>>>> 888b532cfc5a1ba9038994c2e8ad367e48249d60
    </div>
  );
};
// --- タスク詳細モーダル ---
interface TaskDetailModalProps {
  task: ScheduledEvent;
  onClose: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose }) => {
  const checkItem = task.ScheduledMaintenance?.CheckItem ?? '';
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#232526',
          color: '#fff',
          borderRadius: 12,
          minWidth: 320,
          maxWidth: 400,
          padding: '2rem 2.2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 22,
            cursor: 'pointer',
          }}
          aria-label="閉じる"
        >×</button>
        <h2 style={{ color: '#00c6fb', fontSize: '1.3rem', marginBottom: 16, textAlign: 'center' }}>
          {task.ScheduledMaintenance?.Title || '(タイトルなし)'}
        </h2>
        <div style={{ marginBottom: 10 }}>
          <strong>機械名：</strong> {task.MachineName || '(設備名なし)'}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>点検項目：</strong> {checkItem || 'ー'}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>期限：</strong> {new Date(task.DueDate).toLocaleDateString()}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>担当者：</strong> {task.AssigneesDisplayName || '未割当'}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>チーム：</strong> {task.AssigneesGroupName || '未所属'}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>拠点：</strong> {task.SiteName || 'ー'}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>ステータス：</strong> {task.Status}
        </div>
        <div style={{ fontSize: 12, color: '#b2bec3', marginTop: 18, textAlign: 'center' }}>
          画面外クリックまたは「×」で閉じる
        </div>
      </div>
    </div>
  );
};

const SummaryPanel: React.FC<{ groupedTasks: GroupedTasks }> = ({ groupedTasks }) => {
  return (
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
};

export default TaskBoard;