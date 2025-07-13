import React, { useEffect, useState } from 'react';
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

  // 説明.mdボタン
  const handleOpenDescription = () => {
    window.open('/description.md', '_blank');
  };

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          '/odata/published_odata_service_team/v1/Teams?$expand=Team_Sites'
        );
        const data = await response.json();
        const siteSet = new Set<string>();
        const validTeams = data.value.filter((team: Team) => team.Team_Sites?.SiteNameCaption);
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
        const response = await fetch(
          '/odata/published_odata_service_scheduledevents/v1/ScheduledEvents?$expand=ScheduledMaintenance'
        );

        if (!response.ok) {
          throw new Error(`APIエラー: ステータスコード ${response.status}`);
        }

        const data = await response.json();
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
        <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
          <Carousel groupedTasks={groupedTasks} />
          <SummaryPanel groupedTasks={groupedTasks} />
        </div>
      )}
    </div>
  );
};

const Carousel: React.FC<{ groupedTasks: GroupedTasks }> = ({ groupedTasks }) => {
  const assignees = Object.keys(groupedTasks);
  const [currentIndex, setCurrentIndex] = useState(0);

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