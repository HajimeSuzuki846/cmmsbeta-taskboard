import React, { useEffect, useState } from 'react';

// 型定義
type ScheduledMaintenance = {
  ID: number;
  Title: string;
  TitleAndCheckItem: string;
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

  const handleOpenDescription = () => {
    window.open('/description.md', '_blank');
  };

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/odata/published_odata_service_team/v1/Teams?$expand=Team_Sites');
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
        // Lambda API → S3 URL取得
        const res = await fetch('https://wminkbl9l6.execute-api.us-west-2.amazonaws.com/prod/tasks');
        const result = await res.json();  // result.body は文字列！
        const { url } = JSON.parse(result.body);

        // S3 URLからMendix APIの実データ取得
        const dataRes = await fetch(url);
        const data = await dataRes.json();

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

  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif', position: 'relative' }}>
      {/* 画面説明ボタン */}
      <button
        onClick={handleOpenDescription}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        画面説明
      </button>

      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>当月の未完了タスク</h1>

      <label>
        拠点選択：
        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          style={{ marginLeft: '0.5rem', marginBottom: '1rem' }}
        >
          {sites.map(site => (
            <option key={site} value={site}>{site}</option>
          ))}
        </select>
      </label>

      <label style={{ marginLeft: '1rem' }}>
        チーム選択：
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          style={{ marginLeft: '0.5rem', marginBottom: '1rem' }}
        >
          <option value="全て">全て</option>
          {teams
            .filter(team => team.Team_Sites.SiteNameCaption === selectedSite)
            .map(team => (
              <option key={team.ID} value={team.Name}>{team.Name}</option>
            ))}
        </select>
      </label>

      {loading && <p>読み込み中...</p>}
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>エラーが発生しました：{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
          <Carousel groupedTasks={groupedTasks} />
          <SummaryPanel groupedTasks={groupedTasks} />
        </div>
      )}
    </div>
  );
};

// カルーセル表示
const Carousel: React.FC<{ groupedTasks: GroupedTasks }> = ({ groupedTasks }) => {
  const assignees = Object.keys(groupedTasks);
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleAssignees = assignees.length <= 4
    ? assignees
    : assignees.slice(currentIndex, currentIndex + 4);

  const handlePrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));
  const handleNext = () => setCurrentIndex((prev) => Math.min(prev + 1, assignees.length - 4));

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'nowrap', flex: 1, minHeight: '350px', marginRight: '120px', position: 'relative' }}>
      {assignees.length > 4 && (
        <button onClick={handlePrev} disabled={currentIndex === 0} style={{ height: '40px', position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}>◀</button>
      )}
      <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
        {visibleAssignees.map((assignee) => (
          <div
            key={assignee}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              borderRadius: '8px',
              minWidth: '250px',
              background: '#f9f9f9',
              flex: '0 0 250px'
            }}
          >
            <h2 style={{ fontSize: '1.2rem', borderBottom: '1px solid #aaa', paddingBottom: '0.5rem' }}>
              {assignee}
            </h2>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {groupedTasks[assignee].map((task) => (
                <li
                  key={task.EventId}
                  style={{
                    background: '#fff',
                    padding: '0.5rem',
                    margin: '0.5rem 0',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <strong>{task.ScheduledMaintenance?.Title || '(タイトルなし)'}</strong><br />
                  機械: {task.MachineName}<br />
                  期限: {new Date(task.DueDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {assignees.length > 4 && (
        <button onClick={handleNext} disabled={currentIndex >= assignees.length - 4} style={{ height: '40px', position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>▶</button>
      )}
    </div>
  );
};

// サマリーパネル
const SummaryPanel: React.FC<{ groupedTasks: GroupedTasks }> = ({ groupedTasks }) => {
  return (
    <div style={{
      minWidth: '90px',
      maxWidth: '120px',
      borderLeft: '2px solid #eee',
      padding: '0.5rem',
      background: '#f4f4f4',
      position: 'absolute',
      right: 0,
      top: 0,
      height: '100%'
    }}>
      <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>担当者サマリー</h3>
      <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.85rem' }}>
        {Object.entries(groupedTasks).map(([assignee, tasks]) => (
          <li key={assignee} style={{ marginBottom: '0.3rem' }}>
            <strong>{assignee}</strong>：{tasks.length}件
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskBoard;
