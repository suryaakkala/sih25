//components/ai-recommendations.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  BookOpen, 
  Calendar, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  RefreshCw,
  Lightbulb,
  CalendarClock,
  UserCheck,
  ListTodo
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Recommendation {
  id: string
  type: "study_tip" | "schedule_optimization" | "attendance_improvement" | "task_prioritization"
  title: string
  description: string
  priority: "high" | "medium" | "low"
  actionable: boolean
  estimated_impact: string
  category: string
  created_at?: string
}

interface RecommendationStats {
  total: number
  actedUpon: number
  highPriority: number
}

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [stats, setStats] = useState<RecommendationStats>({ total: 0, actedUpon: 0, highPriority: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [viewAll, setViewAll] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  useEffect(() => {
    // Calculate stats whenever recommendations change
    const highPriority = recommendations.filter(rec => rec.priority === "high").length
    setStats({
      total: recommendations.length,
      actedUpon: recommendations.filter(rec => rec.actionable).length,
      highPriority
    })
  }, [recommendations])

  const fetchRecommendations = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const response = await fetch("/api/recommendations")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.recommendations) {
        setRecommendations(data.recommendations)
      } else {
        setRecommendations([])
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
      setError("Failed to load recommendations. Please try again.")
      // Fallback to empty array instead of mock data
      setRecommendations([])
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  const handleRecommendationAction = async (
    recommendationId: string,
    action: "viewed" | "dismissed" | "acted_upon",
  ) => {
    try {
      await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recommendationId,
          action,
        }),
      })

      if (action === "dismissed") {
        setDismissedIds((prev) => new Set([...prev, recommendationId]))
      }
    } catch (error) {
      console.error("Error tracking recommendation interaction:", error)
    }
  }

  const handleRefresh = () => {
    fetchRecommendations()
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "study_tip":
        return <BookOpen className="h-5 w-5 text-blue-500" />
      case "schedule_optimization":
        return <Calendar className="h-5 w-5 text-green-500" />
      case "attendance_improvement":
        return <UserCheck className="h-5 w-5 text-amber-500" />
      case "task_prioritization":
        return <ListTodo className="h-5 w-5 text-purple-500" />
      default:
        return <Lightbulb className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="h-3 w-3" />
      case "medium":
        return <TrendingUp className="h-3 w-3" />
      case "low":
        return <CheckCircle className="h-3 w-3" />
      default:
        return <Info className="h-3 w-3" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "study_tip":
        return "Study Tip"
      case "schedule_optimization":
        return "Schedule"
      case "attendance_improvement":
        return "Attendance"
      case "task_prioritization":
        return "Prioritization"
      default:
        return "Recommendation"
    }
  }

  const visibleRecommendations = recommendations.filter(rec => !dismissedIds.has(rec.id))
  const displayRecommendations = viewAll ? visibleRecommendations : visibleRecommendations.slice(0, 3)

  if (loading) {
    return <RecommendationSkeleton />
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Recommendations
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-1"
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Personalized suggestions based on your learning patterns and performance
        </CardDescription>
        
        {stats.total > 0 && (
          <div className="flex gap-4 pt-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{stats.total}</span>
              <span>Total</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{stats.highPriority}</span>
              <span>High Priority</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{stats.actedUpon}</span>
              <span>Actionable</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-3 opacity-50" />
            <h3 className="font-medium text-lg mb-1">Unable to load recommendations</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        ) : visibleRecommendations.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-medium text-lg mb-1">No recommendations right now</h3>
            <p className="text-sm text-muted-foreground">
              Check back later for personalized suggestions based on your activity.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayRecommendations.map((recommendation) => (
              <RecommendationItem
                key={recommendation.id}
                recommendation={recommendation}
                onAction={handleRecommendationAction}
                getRecommendationIcon={getRecommendationIcon}
                getPriorityColor={getPriorityColor}
                getPriorityIcon={getPriorityIcon}
                getTypeLabel={getTypeLabel}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      {visibleRecommendations.length > 3 && (
        <CardFooter>
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={() => setViewAll(!viewAll)}
          >
            {viewAll ? `Show Less` : `View All Recommendations (${visibleRecommendations.length})`}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

interface RecommendationItemProps {
  recommendation: Recommendation
  onAction: (id: string, action: string) => void
  getRecommendationIcon: (type: string) => JSX.Element
  getPriorityColor: (priority: string) => string
  getPriorityIcon: (priority: string) => JSX.Element
  getTypeLabel: (type: string) => string
}

function RecommendationItem({ 
  recommendation, 
  onAction, 
  getRecommendationIcon, 
  getPriorityColor, 
  getPriorityIcon,
  getTypeLabel
}: RecommendationItemProps) {
  return (
    <Alert key={recommendation.id} className="relative p-4 rounded-lg border">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onAction(recommendation.id, "dismissed")}
        className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full"
        aria-label="Dismiss recommendation"
      >
        <X className="h-3 w-3" />
      </Button>

      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {getRecommendationIcon(recommendation.type)}
        </div>
        
        <div className="flex-grow space-y-2">
          <div className="flex items-start justify-between gap-2">
            <AlertTitle className="text-base leading-tight pr-6">
              {recommendation.title}
            </AlertTitle>
            <Badge
              variant="outline"
              className={cn(
                "text-xs flex items-center gap-1 whitespace-nowrap",
                getPriorityColor(recommendation.priority)
              )}
            >
              {getPriorityIcon(recommendation.priority)}
              {recommendation.priority}
            </Badge>
          </div>
          
          <AlertDescription className="text-sm text-muted-foreground">
            {recommendation.description}
          </AlertDescription>
          
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary" className="text-xs font-normal">
              {getTypeLabel(recommendation.type)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {recommendation.estimated_impact}
            </span>
            {recommendation.created_at && (
              <span className="text-xs text-muted-foreground">
                {new Date(recommendation.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {recommendation.actionable && (
        <div className="flex justify-end mt-3">
          <Button
            size="sm"
            onClick={() => onAction(recommendation.id, "acted_upon")}
          >
            Take Action
          </Button>
        </div>
      )}
    </Alert>
  )
}

function RecommendationSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-40 rounded" />
          </div>
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
        <Skeleton className="h-4 w-60 rounded" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg border space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}