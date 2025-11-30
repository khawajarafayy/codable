import { useState } from "react";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Badge } from "../../../../components/ui/badge";
import { Separator } from "../../../../components/ui/separator";
import {
  Users,
  Plus,
  X,
  FileText,
  Send,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Checkbox } from "../../../../components/ui/checkbox";

const availableStudents = [
  { id: 1, name: "Layba Shahid", email: "laibashahid@email.com", enrolled: true },
  { id: 2, name: "Sarah Ahmed", email: "sarah.ahmed@email.com", enrolled: true },
  { id: 3, name: "Khawaja", email: "khawaja@email.com", enrolled: false },
  { id: 4, name: "Fatima Zahra", email: "fatima.z@email.com", enrolled: true },
  { id: 5, name: "Rafay", email: "rafay@email.com", enrolled: false },
  { id: 6, name: "Ayesha", email: "aisha@email.com", enrolled: true },
  { id: 7, name: "Hamza Iqbal", email: "hamza.i@email.com", enrolled: false },
  { id: 8, name: "Zainab Ali", email: "zainab.a@email.com", enrolled: true },
];

const javaTopics = [
  "Core Java Fundamentals",
  "Object-Oriented Programming",
  "Collections Framework",
  "Exception Handling",
  "Java Streams API",
  "Multithreading & Concurrency",
  "Spring Framework Basics",
  "JDBC & Database Connectivity",
  "Design Patterns",
  "JVM Internals & Memory Management"
];

const existingClasses = [
  {
    id: 1,
    name: "Java Fundamentals - Spring 2024",
    students: 12,
    topics: 5,
    tasks: 8,
    submissions: 45,
    status: "active"
  },
  {
    id: 2,
    name: "Advanced Java - OOP Mastery",
    students: 8,
    topics: 4,
    tasks: 6,
    submissions: 32,
    status: "active"
  }
];

export function ClassCreation() {
  const [className, setClassName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([1, 2, 4, 6, 8]);
  const [selectedTopics, setSelectedTopics] = useState([
    "Core Java Fundamentals",
    "Object-Oriented Programming",
    "Collections Framework"
  ]);
  const [newTopic, setNewTopic] = useState("");

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleTopicAdd = (topic) => {
    if (topic && !selectedTopics.includes(topic)) {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleTopicRemove = (topic) => {
    setSelectedTopics(selectedTopics.filter(t => t !== topic));
  };

  const handleCreateClass = () => {
    console.log("Creating class:", { className, description, selectedStudents, selectedTopics });
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/40 backdrop-blur-xl border-0 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Classes</p>
              <p className="text-2xl text-white">2</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-400" />
          </div>
        </Card>
        
        <Card className="bg-black/40 backdrop-blur-xl border-0 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Students</p>
              <p className="text-2xl text-white">20</p>
            </div>
            <Users className="h-8 w-8 text-green-400" />
          </div>
        </Card>
        
        <Card className="bg-black/40 backdrop-blur-xl border-0 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending Reviews</p>
              <p className="text-2xl text-white">77</p>
            </div>
            <Clock className="h-8 w-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Class Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
            <h3 className="text-white mb-6">Create New Class</h3>
            
            <div className="space-y-5">
              {/* Class Name */}
              <div className="space-y-2">
                <Label htmlFor="className">Class Name *</Label>
                <Input
                  id="className"
                  placeholder="e.g., Java Fundamentals - Fall 2024"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="bg-input-background/50 border-border/50"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Class Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the goals, curriculum, and expectations for this class..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="bg-input-background/50 border-border/50 resize-none"
                />
              </div>

              {/* Topics */}
              <div className="space-y-3">
                <Label>Assigned Topics *</Label>
                <div className="flex gap-2">
                  <Select onValueChange={handleTopicAdd}>
                    <SelectTrigger className="flex-1 bg-input-background/50 border-border/50">
                      <SelectValue placeholder="Select topics to cover" />
                    </SelectTrigger>
                    <SelectContent>
                      {javaTopics
                        .filter(topic => !selectedTopics.includes(topic))
                        .map((topic) => (
                          <SelectItem key={topic} value={topic}>
                            {topic}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedTopics.map((topic) => (
                    <Badge
                      key={topic}
                      variant="outline"
                      className="bg-blue-500/20 text-blue-400 border-blue-500/30 pr-1"
                    >
                      {topic}
                      <button
                        onClick={() => handleTopicRemove(topic)}
                        className="ml-2 hover:bg-blue-500/30 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                {selectedTopics.length === 0 && (
                  <p className="text-sm text-muted-foreground">No topics selected yet</p>
                )}
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    className="bg-input-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    className="bg-input-background/50 border-border/50"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
            <h3 className="text-white mb-4">Class Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Assign Task
              </Button>
              
              <Button
                variant="outline"
                className="bg-black/40 border-0 hover:bg-accent/50"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Submissions
              </Button>
              
              <Button
                variant="outline"
                className="bg-black/40 border-0 hover:bg-accent/50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column - Students */}
        <div className="space-y-6">
          <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white">Assign Students</h3>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {selectedStudents.length} selected
              </Badge>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {availableStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-border/30 hover:bg-accent/20 transition-colors"
                >
                  <Checkbox
                    id={`student-${student.id}`}
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => handleStudentToggle(student.id)}
                    className="mt-1"
                  />
                  <label
                    htmlFor={`student-${student.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">{student.name}</p>
                      {student.enrolled && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          Enrolled
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </label>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <Button
              variant="outline"
              className="w-full bg-card/50 border-border/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Student
            </Button>
          </Card>
        </div>
      </div>

      {/* Create Button */}
      <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 backdrop-blur-xl border-green-500/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white mb-1">Ready to create this class?</h4>
            <p className="text-sm text-muted-foreground">
              {selectedStudents.length} students will be enrolled in {selectedTopics.length} topics
            </p>
          </div>
          <Button
            onClick={handleCreateClass}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </Button>
        </div>
      </Card>

      {/* Existing Classes */}
      <Card className="bg-black/40 backdrop-blur-xl border-0 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white">Your Classes</h3>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
            View All
          </Button>
        </div>
        
        <div className="space-y-4">
          {existingClasses.map((classItem) => (
            <div
              key={classItem.id}
              className="p-5 rounded-xl bg-accent/10 border border-border/30 hover:bg-accent/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-white mb-1">{classItem.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {classItem.students} students
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {classItem.topics} topics
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {classItem.tasks} tasks
                    </span>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {classItem.status}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-card/50 border-border/50 flex-1">
                  <Send className="h-3 w-3 mr-2" />
                  Assign Task
                </Button>
                <Button size="sm" variant="outline" className="bg-card/50 border-border/50 flex-1">
                  <FileText className="h-3 w-3 mr-2" />
                  Submissions ({classItem.submissions})
                </Button>
                <Button size="sm" variant="outline" className="bg-card/50 border-border/50 flex-1">
                  <BarChart3 className="h-3 w-3 mr-2" />
                  Report
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
