"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loading } from "@/components/ui/loading";
import { Users, Calendar, Briefcase } from "lucide-react";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface Team {
  _id: string;
  name: string;
  description: string;
  members: TeamMember[];
  leader: TeamMember;
  projects: {
    _id: string;
    title: string;
  }[];
  createdAt: string;
}

export default function TeamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-teams");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://localhost:5000/api/teams", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch teams");
        }

        const data = await response.json();
        setTeams(data.data || []);
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast({
          title: "Error",
          description: "Failed to load teams. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [toast]);

  const filteredTeams = teams.filter((team) => {
    if (activeTab === "my-teams" && user) {
      return team.members.some(member => member._id === user._id) || team.leader._id === user._id;
    }
    if (activeTab === "leading" && user) {
      return team.leader._id === user._id;
    }
    return true;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <Loading message="Loading teams..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and collaborations.
          </p>
        </div>
        <Button>
          Create New Team
        </Button>
      </div>

      <Tabs defaultValue="my-teams" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="my-teams">My Teams</TabsTrigger>
          <TabsTrigger value="leading">Leading</TabsTrigger>
          <TabsTrigger value="all">All Teams</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No teams found</p>
              <Button>
                Create Your First Team
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTeams.map((team) => (
                <Card key={team._id}>
                  <CardHeader>
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>
                      Led by {team.leader.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {team.description}
                    </p>
                    
                    <div className="flex items-center mt-4">
                      <Users size={16} className="mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {team.members.length} members
                      </span>
                    </div>
                    
                    <div className="flex items-center mt-2">
                      <Briefcase size={16} className="mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {team.projects.length} projects
                      </span>
                    </div>
                    
                    <div className="flex items-center mt-2">
                      <Calendar size={16} className="mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        Created on {formatDate(team.createdAt)}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Team Members:</p>
                      <div className="flex -space-x-2 overflow-hidden">
                        {team.members.slice(0, 5).map((member) => (
                          <Avatar key={member._id} className="border-2 border-background">
                            {member.avatar ? (
                              <AvatarImage src={member.avatar} alt={member.name} />
                            ) : null}
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                        ))}
                        {team.members.length > 5 && (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-xs font-medium">
                            +{team.members.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View Team
                    </Button>
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