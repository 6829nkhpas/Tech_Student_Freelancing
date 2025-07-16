"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loading } from "@/components/ui/loading";
import { Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  project: {
    _id: string;
    title: string;
  };
  assignedTo: {
    _id: string;
    name: string;
  };
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function TasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assigned");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://localhost:5000/api/tasks", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data = await response.json();
        setTasks(data.data || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast({
          title: "Error",
          description: "Failed to load tasks. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [toast]);

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "assigned" && user) {
      return task.assignedTo._id === user._id;
    }
    if (activeTab === "created" && user) {
      return task.createdBy._id === user._id;
    }
    if (activeTab === "todo") {
      return task.status === "todo";
    }
    if (activeTab === "in-progress") {
      return task.status === "in-progress";
    }
    if (activeTab === "completed") {
      return task.status === "completed";
    }
    return true;
  });

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "low":
        return "secondary";
      case "medium":
        return "default";
      case "high":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "todo":
        return "outline";
      case "in-progress":
        return "default";
      case "completed":
        return "success";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "todo":
        return <AlertCircle size={16} className="mr-2" />;
      case "in-progress":
        return <Clock size={16} className="mr-2" />;
      case "completed":
        return <CheckCircle2 size={16} className="mr-2" />;
      default:
        return null;
    }
  };

  if (loading) {
    return <Loading message="Loading tasks..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage and track your tasks and assignments.
          </p>
        </div>
        <Button>
          Create New Task
        </Button>
      </div>

      <Tabs defaultValue="assigned" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 md:grid-cols-6 lg:w-[600px]">
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="created">Created</TabsTrigger>
          <TabsTrigger value="todo">To Do</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No tasks found</p>
              <Button>
                Create Your First Task
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTasks.map((task) => (
                <Card key={task._id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <CardDescription className="mt-1">
                          Project: {task.project.title}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(task.status)}>
                          <div className="flex items-center">
                            {getStatusIcon(task.status)}
                            <span>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </span>
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {task.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          Due: {formatDate(task.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm">
                          Assigned to: {task.assignedTo.name}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {task.status !== "completed" && (
                      <Button size="sm">
                        {task.status === "todo" ? "Start Task" : "Complete Task"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}