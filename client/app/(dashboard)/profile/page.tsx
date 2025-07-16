'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Briefcase, 
  GraduationCap,
  Plus,
  Trash2,
  Save,
  X,
  Edit,
  Github,
  Linkedin,
  Twitter
} from 'lucide-react';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  bio?: string;
  skills: string[];
  location?: string;
  website?: string;
  social?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  education: {
    _id?: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    from: string;
    to: string;
    current: boolean;
    description?: string;
  }[];
  experience: {
    _id?: string;
    company: string;
    position: string;
    from: string;
    to: string;
    current: boolean;
    description?: string;
  }[];
  points: number;
  badges: string[];
  completedProjects: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [newSkill, setNewSkill] = useState('');
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    from: '',
    to: '',
    current: false,
    description: ''
  });
  const [newExperience, setNewExperience] = useState({
    company: '',
    position: '',
    from: '',
    to: '',
    current: false,
    description: ''
  });
  const [addingEducation, setAddingEducation] = useState(false);
  const [addingExperience, setAddingExperience] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const response = await fetch('http://localhost:5000/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data.data);
        setFormData(data.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      social: {
        ...prev.social,
        [name]: value,
      },
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((s) => s !== skill) || [],
    }));
  };

  const handleEducationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEducation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEducationCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEducation((prev) => ({
      ...prev,
      current: e.target.checked,
    }));
  };

  const handleAddEducation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/users/education', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newEducation),
      });

      if (!response.ok) {
        throw new Error('Failed to add education');
      }

      const data = await response.json();
      setProfile(data.data);
      setFormData(data.data);
      setAddingEducation(false);
      setNewEducation({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        from: '',
        to: '',
        current: false,
        description: ''
      });
      toast({
        title: 'Success',
        description: 'Education added successfully',
      });
    } catch (error) {
      console.error('Error adding education:', error);
      toast({
        title: 'Error',
        description: 'Failed to add education',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/users/education/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete education');
      }

      const data = await response.json();
      setProfile(data.data);
      setFormData(data.data);
      toast({
        title: 'Success',
        description: 'Education deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting education:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete education',
        variant: 'destructive',
      });
    }
  };

  const handleExperienceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewExperience((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleExperienceCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewExperience((prev) => ({
      ...prev,
      current: e.target.checked,
    }));
  };

  const handleAddExperience = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/users/experience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newExperience),
      });

      if (!response.ok) {
        throw new Error('Failed to add experience');
      }

      const data = await response.json();
      setProfile(data.data);
      setFormData(data.data);
      setAddingExperience(false);
      setNewExperience({
        company: '',
        position: '',
        from: '',
        to: '',
        current: false,
        description: ''
      });
      toast({
        title: 'Success',
        description: 'Experience added successfully',
      });
    } catch (error) {
      console.error('Error adding experience:', error);
      toast({
        title: 'Error',
        description: 'Failed to add experience',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/users/experience/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete experience');
      }

      const data = await response.json();
      setProfile(data.data);
      setFormData(data.data);
      toast({
        title: 'Success',
        description: 'Experience deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting experience:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete experience',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          social: formData.social,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      setProfile(data.data);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSkills = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/users/skills', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills: formData.skills }),
      });

      if (!response.ok) {
        throw new Error('Failed to update skills');
      }

      const data = await response.json();
      setProfile(data.data);
      toast({
        title: 'Success',
        description: 'Skills updated successfully',
      });
    } catch (error) {
      console.error('Error updating skills:', error);
      toast({
        title: 'Error',
        description: 'Failed to update skills',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Profile</h1>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
        )}
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 md:grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="md:col-span-2">
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Profile Information</h2>
                
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">
                        Full Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium mb-1">
                        Bio
                      </label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Tell us about yourself"
                      />
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium mb-1">
                        Location
                      </label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location || ''}
                        onChange={handleChange}
                        placeholder="City, Country"
                      />
                    </div>

                    <div>
                      <label htmlFor="website" className="block text-sm font-medium mb-1">
                        Website
                      </label>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website || ''}
                        onChange={handleChange}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-medium mb-1">
                        Social Links
                      </label>
                      <div className="flex items-center">
                        <Github className="h-5 w-5 mr-2" />
                        <Input
                          name="github"
                          value={formData.social?.github || ''}
                          onChange={handleSocialChange}
                          placeholder="GitHub username"
                        />
                      </div>
                      <div className="flex items-center">
                        <Linkedin className="h-5 w-5 mr-2" />
                        <Input
                          name="linkedin"
                          value={formData.social?.linkedin || ''}
                          onChange={handleSocialChange}
                          placeholder="LinkedIn username"
                        />
                      </div>
                      <div className="flex items-center">
                        <Twitter className="h-5 w-5 mr-2" />
                        <Input
                          name="twitter"
                          value={formData.social?.twitter || ''}
                          onChange={handleSocialChange}
                          placeholder="Twitter username"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-3 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{profile?.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Mail className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                      <p>{profile?.email}</p>
                    </div>

                    {profile?.bio && (
                      <div className="pt-2">
                        <p className="text-sm">{profile.bio}</p>
                      </div>
                    )}

                    {profile?.location && (
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-3 text-muted-foreground" />
                        <p>{profile.location}</p>
                      </div>
                    )}

                    {profile?.website && (
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 mr-3 text-muted-foreground" />
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}

                    {profile?.social && Object.values(profile.social).some(link => link) && (
                      <div className="pt-2">
                        <p className="text-sm font-medium mb-2">Social Links</p>
                        <div className="flex space-x-3">
                          {profile.social.github && (
                            <a 
                              href={`https://github.com/${profile.social.github}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Github className="h-5 w-5" />
                            </a>
                          )}
                          {profile.social.linkedin && (
                            <a 
                              href={`https://linkedin.com/in/${profile.social.linkedin}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Linkedin className="h-5 w-5" />
                            </a>
                          )}
                          {profile.social.twitter && (
                            <a 
                              href={`https://twitter.com/${profile.social.twitter}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Twitter className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Skills & Stats */}
            <div className="space-y-6">
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Skills</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.skills?.map((skill) => (
                      <div 
                        key={skill} 
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center"
                      >
                        {skill}
                        {isEditing && (
                          <button 
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-2 text-primary hover:text-primary/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isEditing && (
                    <div className="pt-2">
                      <div className="flex">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill"
                          className="mr-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                        />
                        <Button type="button" onClick={handleAddSkill} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        onClick={handleUpdateSkills} 
                        className="w-full mt-4"
                        variant="outline"
                      >
                        Update Skills
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Points</p>
                    <p className="font-medium">{profile?.points || 0}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Badges</p>
                    <p className="font-medium">{profile?.badges?.length || 0}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Completed Projects</p>
                    <p className="font-medium">{profile?.completedProjects || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="education" className="space-y-6 mt-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Education</h2>
              <Button onClick={() => setAddingEducation(!addingEducation)}>
                {addingEducation ? (
                  <>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Add Education
                  </>
                )}
              </Button>
            </div>

            {addingEducation && (
              <div className="mb-8 p-4 border border-border rounded-lg bg-muted/50">
                <h3 className="text-lg font-medium mb-4">Add Education</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="institution" className="block text-sm font-medium mb-1">
                      Institution
                    </label>
                    <Input
                      id="institution"
                      name="institution"
                      value={newEducation.institution}
                      onChange={handleEducationChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="degree" className="block text-sm font-medium mb-1">
                      Degree
                    </label>
                    <Input
                      id="degree"
                      name="degree"
                      value={newEducation.degree}
                      onChange={handleEducationChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="fieldOfStudy" className="block text-sm font-medium mb-1">
                      Field of Study
                    </label>
                    <Input
                      id="fieldOfStudy"
                      name="fieldOfStudy"
                      value={newEducation.fieldOfStudy}
                      onChange={handleEducationChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="from" className="block text-sm font-medium mb-1">
                        From
                      </label>
                      <Input
                        id="from"
                        name="from"
                        type="date"
                        value={newEducation.from}
                        onChange={handleEducationChange}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="to" className="block text-sm font-medium mb-1">
                        To
                      </label>
                      <Input
                        id="to"
                        name="to"
                        type="date"
                        value={newEducation.to}
                        onChange={handleEducationChange}
                        disabled={newEducation.current}
                        required={!newEducation.current}
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="current-edu"
                      checked={newEducation.current}
                      onChange={handleEducationCheckbox}
                      className="mr-2"
                    />
                    <label htmlFor="current-edu" className="text-sm">
                      I am currently studying here
                    </label>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      id="description"
                      name="description"
                      value={newEducation.description}
                      onChange={handleEducationChange}
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleAddEducation}>
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            )}

            {profile?.education && profile.education.length > 0 ? (
              <div className="space-y-6">
                {profile.education.map((edu) => (
                  <div key={edu._id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{edu.institution}</h3>
                        <p className="text-sm">
                          {edu.degree}, {edu.fieldOfStudy}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(edu.from).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                          {edu.current 
                            ? 'Present' 
                            : new Date(edu.to).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                        {edu.description && (
                          <p className="text-sm mt-2">{edu.description}</p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteEducation(edu._id || '')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No education added yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="experience" className="space-y-6 mt-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Experience</h2>
              <Button onClick={() => setAddingExperience(!addingExperience)}>
                {addingExperience ? (
                  <>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Add Experience
                  </>
                )}
              </Button>
            </div>

            {addingExperience && (
              <div className="mb-8 p-4 border border-border rounded-lg bg-muted/50">
                <h3 className="text-lg font-medium mb-4">Add Experience</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium mb-1">
                      Company
                    </label>
                    <Input
                      id="company"
                      name="company"
                      value={newExperience.company}
                      onChange={handleExperienceChange}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="position" className="block text-sm font-medium mb-1">
                      Position
                    </label>
                    <Input
                      id="position"
                      name="position"
                      value={newExperience.position}
                      onChange={handleExperienceChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="exp-from" className="block text-sm font-medium mb-1">
                        From
                      </label>
                      <Input
                        id="exp-from"
                        name="from"
                        type="date"
                        value={newExperience.from}
                        onChange={handleExperienceChange}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="exp-to" className="block text-sm font-medium mb-1">
                        To
                      </label>
                      <Input
                        id="exp-to"
                        name="to"
                        type="date"
                        value={newExperience.to}
                        onChange={handleExperienceChange}
                        disabled={newExperience.current}
                        required={!newExperience.current}
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="current-exp"
                      checked={newExperience.current}
                      onChange={handleExperienceCheckbox}
                      className="mr-2"
                    />
                    <label htmlFor="current-exp" className="text-sm">
                      I am currently working here
                    </label>
                  </div>

                  <div>
                    <label htmlFor="exp-description" className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      id="exp-description"
                      name="description"
                      value={newExperience.description}
                      onChange={handleExperienceChange}
                      rows={3}
                    />
                  </div>

                  <Button onClick={handleAddExperience}>
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            )}

            {profile?.experience && profile.experience.length > 0 ? (
              <div className="space-y-6">
                {profile.experience.map((exp) => (
                  <div key={exp._id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{exp.position}</h3>
                        <p className="text-sm">{exp.company}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(exp.from).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                          {exp.current 
                            ? 'Present' 
                            : new Date(exp.to).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                        {exp.description && (
                          <p className="text-sm mt-2">{exp.description}</p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteExperience(exp._id || '')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">No experience added yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}