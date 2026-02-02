import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardBody, Input } from '@heroui/react';
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

  const levelStyles = {
    'level-0': 'bg-slate-200 border border-transparent',
    'level-1': 'bg-emerald-200 border border-emerald-200',
    'level-2': 'bg-emerald-400 border border-emerald-400',
    'level-3': 'bg-emerald-500 border border-emerald-500',
    'level-4': 'bg-emerald-700 border border-emerald-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Daka 打卡</h1>
            <p className="text-sm text-slate-500">
              按项目记录每日打卡，形成可视化贡献图。
            </p>
          </div>
          <form className="flex flex-wrap items-center gap-2" onSubmit={handleAddProject}>
            <Input
              type="text"
              size="sm"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="新建项目名称"
              aria-label="新建项目名称"
              className="min-w-[200px]"
            />
            <Button type="submit" color="primary" size="sm">
              添加
            </Button>
          </form>
        </header>

        <Card className="border border-slate-200 bg-white">
          <CardBody className="flex flex-wrap gap-2">
            {projects.map((project) => {
              const isActive = project.id === activeProjectId;
              return (
                <Button
                  key={project.id}
                  type="button"
                  size="sm"
                  variant={isActive ? 'solid' : 'bordered'}
                  color={isActive ? 'primary' : 'default'}
                  className={isActive ? '' : 'text-slate-700'}
                  onClick={() => setActiveProjectId(project.id)}
                >
                  {project.name}
                </Button>
              );
            })}
          </CardBody>
        </Card>

        <Card className="border border-slate-200 bg-white">
          <CardBody className="space-y-4">
            <div className="grid grid-cols-[40px_repeat(53,minmax(0,1fr))] gap-1 text-xs text-slate-500">
              <div />
              {monthLabels.map((label, index) => (
                <div key={`${label.month}-${index}`} className="text-left">
                  {label.label}
                </div>
              ))}
            </div>
            <div className="flex gap-4 overflow-x-auto">
              <div className="grid grid-rows-7 gap-1 text-[11px] text-slate-500">
                {WEEKDAY_LABELS.map((label, index) => (
                  <div key={label} className="flex h-3 items-center">
                    {index % 2 ? label : ''}
                  </div>
                ))}
              </div>
              <div className="grid auto-cols-min grid-flow-col gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-1">
                    {week.map((date) => {
                      const key = toDateKey(date);
                      const isFuture = date > today;
                      const isChecked = !!activeCheckins[key];
                      const level = isChecked ? 'level-4' : 'level-0';
                      return (
                        <Button
                          key={key}
                          type="button"
                          size="sm"
                          isIconOnly
                          variant="flat"
                          aria-label={`${key} ${isChecked ? '已打卡' : '未打卡'}`}
                          className={`h-3 w-3 min-w-0 rounded-sm p-0 ${levelStyles[level]}`}
                          disabled={isFuture}
                          onClick={() => handleToggleDay(date)}
                        >
                          <span className="sr-only">{key}</span>
                        </Button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>少</span>
              <div className="flex gap-1">
                {Object.values(levelStyles).map((style, index) => (
                  <span
                    key={`legend-${index}`}
                    className={`inline-block h-3 w-3 rounded-sm ${style}`}
                  />
                ))}
              </div>
              <span>多</span>
            </div>
            <p className="text-sm text-slate-500">
              点击格子即可打卡/取消打卡，数据已保存在本地浏览器。
            </p>
          </CardBody>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border border-slate-200 bg-white">
            <CardBody className="space-y-1">
              <span className="text-xs text-slate-500">累计打卡</span>
              <span className="text-2xl font-semibold">
                {Object.keys(activeCheckins).length}
              </span>
            </CardBody>
          </Card>
          <Card className="border border-slate-200 bg-white">
            <CardBody className="space-y-1">
              <span className="text-xs text-slate-500">最近打卡</span>
              <span className="text-2xl font-semibold">
                {Object.keys(activeCheckins)
                  .sort()
                  .slice(-1)[0] || '暂无'}
              </span>
            </CardBody>
          </Card>
          <Card className="border border-slate-200 bg-white">
            <CardBody className="space-y-1">
              <span className="text-xs text-slate-500">连续天数</span>
              <span className="text-2xl font-semibold">
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
            </CardBody>
          </Card>
        </section>
      </div>
    </div>
  );
}
