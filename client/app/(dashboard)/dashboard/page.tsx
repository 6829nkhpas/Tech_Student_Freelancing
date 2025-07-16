'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Icons
import { 
  Briefcase, 
  Users, 
  CheckSquare, 
  Award,
  Clock,
  Calendar,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface DashboardStats {
  projectsCount: number;
  teamsCount: number;
  tasksCount: number;
  completedTasksCount: number;
  points: number;
  badges: number;
}

interface RecentProject {
  _id: string;
  title: string;
  status: string;
  deadline: string;
}

interface RecentTask {
  _id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        // Fetch dashboard stats
        const statsResponse = await fetch('http://localhost:5000/api/users/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!statsResponse.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }

        const statsData = await statsResponse.json();
        setStats(statsData.data);

        // Fetch recent projects
        const projectsResponse = await fetch('http://localhost:5000/api/projects?limit=5', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!projectsResponse.ok) {
          throw new Error('Failed to fetch recent projects');
        }

        const projectsData = await projectsResponse.json();
        setRecentProjects(projectsData.data);

        // Fetch recent tasks
        const tasksResponse = await fetch('http://localhost:5000/api/tasks?limit=5', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!tasksResponse.ok) {
          throw new Error('Failed to fetch recent tasks');
        }

        const tasksData = await tasksResponse.json();
        setRecentTasks(tasksData.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = () => {
      switch (status.toLowerCase()) {
        case 'completed':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'in progress':
          return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'cancelled':
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      }
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
        {status}
      </span>
    );
  };

  // Priority badge component
  const PriorityBadge = ({ priority }: { priority: string }) => {
    const getPriorityColor = () => {
      switch (priority.toLowerCase()) {
        case 'high':
          return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'medium':
          return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'low':
          return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        default:
          return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      }
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor()}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-primary/10 mr-4">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Projects</p>
              <h3 className="text-2xl font-bold">{stats?.projectsCount || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-primary/10 mr-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Teams</p>
              <h3 className="text-2xl font-bold">{stats?.teamsCount || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-primary/10 mr-4">
              <CheckSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tasks</p>
              <h3 className="text-2xl font-bold">{stats?.tasksCount || 0}</h3>
              <p className="text-xs text-muted-foreground">
                {stats?.completedTasksCount || 0} completed
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-primary/10 mr-4">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Points</p>
              <h3 className="text-2xl font-bold">{stats?.points || 0}</h3>
              <p className="text-xs text-muted-foreground">
                {stats?.badges || 0} badges earned
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Projects</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/projects" className="flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {recentProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Project</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project) => (
                  <tr key={project._id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/projects/${project._id}`} className="font-medium hover:text-primary">
                        {project.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                        {formatDate(project.deadline)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No projects found</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard/projects/new">Create New Project</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Recent Tasks */}
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Tasks</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/tasks" className="flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {recentTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Task</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task._id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/tasks/${task._id}`} className="font-medium hover:text-primary">
                        {task.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                        {formatDate(task.deadline)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tasks found</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard/tasks/new">Create New Task</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}