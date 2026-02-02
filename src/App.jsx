import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Tooltip } from '@heroui/react';
import { atom, useAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  getCalendarWeeks,
  getMonthLabels,
  startOfDay,
  toDateKey,
} from './utils/date.js';
import {
  loadCheckins,
  loadProjects,
  saveCheckins,
  saveProjects,
} from './utils/storage.js';

const DEFAULT_PROJECT = { id: 'default', name: '健身' };
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const selectedDateAtom = atom(null);
const isDialogOpenAtom = atom(false);

function createProject(name) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name,
  };
}

export default function App() {
  const [projects, setProjects] = useState([DEFAULT_PROJECT]);
  const [activeProjectId, setActiveProjectId] = useState(DEFAULT_PROJECT.id);
  const [checkins, setCheckins] = useState({});
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);
  const [isDialogOpen, setIsDialogOpen] = useAtom(isDialogOpenAtom);

  useEffect(() => {
    const storedProjects = loadProjects();
    if (storedProjects.length) {
      setProjects(storedProjects);
      setActiveProjectId(storedProjects[0].id);
    }
    setCheckins(loadCheckins());
  }, []);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveCheckins(checkins);
  }, [checkins]);

  const activeCheckins = checkins[activeProjectId] || {};

  const weeks = useMemo(() => getCalendarWeeks(new Date(), 365), []);
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);

  const handleToggleDay = (date) => {
    const key = toDateKey(date);
    setCheckins((prev) => {
      const projectCheckins = { ...(prev[activeProjectId] || {}) };
      if (projectCheckins[key]) {
        delete projectCheckins[key];
      } else {
        projectCheckins[key] = true;
      }
      return { ...prev, [activeProjectId]: projectCheckins };
    });
  };

  const handleOpenDialog = (date) => {
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleConfirmCheckin = () => {
    if (!selectedDate) return;
    handleToggleDay(selectedDate);
    handleCloseDialog();
  };

  const handleAddProject = (event) => {
    event.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    const project = createProject(trimmed);
    setProjects((prev) => [project, ...prev]);
    setActiveProjectId(project.id);
    setNewProjectName('');
  };

  const today = startOfDay(new Date());
  const selectedDateKey = selectedDate ? toDateKey(selectedDate) : '';
  const selectedDateStatus = selectedDateKey
    ? activeCheckins[selectedDateKey]
      ? '已打卡'
      : '未打卡'
    : '';

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Daka 打卡</h1>
          <p className="subtitle">按项目记录每日打卡，形成可视化贡献图。</p>
        </div>
        <form className="project-form" onSubmit={handleAddProject}>
          <input
            type="text"
            value={newProjectName}
            onChange={(event) => setNewProjectName(event.target.value)}
            placeholder="新建项目名称"
            aria-label="新建项目名称"
          />
          <button type="submit">添加</button>
        </form>
      </header>

      <section className="project-section">
        <div className="project-list">
          {projects.map((project) => (
            <button
              key={project.id}
              type="button"
              className={
                project.id === activeProjectId
                  ? 'project-button active'
                  : 'project-button'
              }
              onClick={() => setActiveProjectId(project.id)}
            >
              {project.name}
            </button>
          ))}
        </div>
      </section>

      <section className="calendar-section">
        <div className="month-row">
          <div className="spacer" />
          {monthLabels.map((label, index) => (
            <div key={`${label.month}-${index}`} className="month-label">
              {label.label}
            </div>
          ))}
        </div>
        <div className="calendar-grid">
          <div className="weekday-column">
            {WEEKDAY_LABELS.map((label, index) => (
              <div key={label} className={index % 2 ? 'weekday muted' : 'weekday'}>
                {index % 2 ? label : ''}
              </div>
            ))}
          </div>
          <div className="weeks">
            {weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="week-column">
                {week.map((date) => {
                  const key = toDateKey(date);
                  const isFuture = date > today;
                  const isChecked = !!activeCheckins[key];
                  const level = isChecked ? 'level-4' : 'level-0';
                  return (
                    <Tooltip
                      key={key}
                      content={
                        <div className="tooltip-content">
                          <div>{key}</div>
                          <div>{isChecked ? '已打卡' : '未打卡'}</div>
                        </div>
                      }
                      showArrow
                    >
                      <span className="day-cell-wrapper">
                        <button
                          type="button"
                          className={`day-cell ${level}`}
                          disabled={isFuture}
                          onClick={() => handleOpenDialog(date)}
                          aria-label={`${key} ${isChecked ? '已打卡' : '未打卡'}`}
                        />
                      </span>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="legend">
          <span>少</span>
          <div className="legend-scale">
            <span className="legend-cell level-0" />
            <span className="legend-cell level-1" />
            <span className="legend-cell level-2" />
            <span className="legend-cell level-3" />
            <span className="legend-cell level-4" />
          </div>
          <span>多</span>
        </div>
        <p className="hint">
          点击格子查看详情并确认打卡，数据已保存在本地浏览器。
        </p>
      </section>

      <Modal isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>确认打卡</ModalHeader>
              <ModalBody>
                <p>日期：{selectedDateKey || '未选择'}</p>
                <p>当前状态：{selectedDateStatus || '未选择'}</p>
              </ModalBody>
              <ModalFooter>
                <button type="button" onClick={onClose}>
                  取消
                </button>
                <button type="button" onClick={handleConfirmCheckin}>
                  确认
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <section className="stats-section">
        <div className="stat">
          <span className="stat-label">累计打卡</span>
          <span className="stat-value">{Object.keys(activeCheckins).length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">最近打卡</span>
          <span className="stat-value">
            {Object.keys(activeCheckins)
              .sort()
              .slice(-1)[0] || '暂无'}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">连续天数</span>
          <span className="stat-value">
            {(() => {
              let streak = 0;
              let cursor = today;
              while (true) {
                const key = toDateKey(cursor);
                if (activeCheckins[key]) {
                  streak += 1;
                  cursor = addDays(cursor, -1);
                } else {
                  break;
                }
              }
              return streak;
            })()}
          </span>
        </div>
      </section>
    </div>
  );
}
