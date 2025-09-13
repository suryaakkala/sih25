"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, TrendingUp, Clock, Target, BookOpen, Calendar, X, CheckCircle, AlertTriangle, Info } from "lucide-react"

interface Recommendation {
  id: string
  type: "study_tip" | "schedule_optimization" | "attendance_improvement" | "task_prioritization"
  title: string
  description: string
  priority: "high" | "medium" | "low"
  actionable: boolean
  estimated_impact: string
  category: string
}

export default function AIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const response = await fetch("/api/recommendations")
      const data = await response.json()

      if (data.recommendations) {
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error)
    } finally {
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

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "study_tip":
        return <BookOpen className="h-5 w-5 text-blue-600" />
      case "schedule_optimization":
        return <Calendar className="h-5 w-5 text-green-600" />
      case "attendance_improvement":
        return <Clock className="h-5 w-5 text-orange-600" />
      case "task_prioritization":
        return <Target className="h-5 w-5 text-purple-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
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

  const visibleRecommendations = recommendations.filter((rec) => !dismissedIds.has(rec.id))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (visibleRecommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No new recommendations at this time.</p>
            <p className="text-sm text-gray-400 mt-1">Keep up the great work!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          AI Recommendations
        </CardTitle>
        <CardDescription>Personalized suggestions to improve your academic performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visibleRecommendations.slice(0, 3).map((recommendation) => (
            <Alert key={recommendation.id} className="relative">
              <div className="flex items-start gap-3">
                {getRecommendationIcon(recommendation.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-900">{recommendation.title}</h4>
                    <Badge variant="outline" className={`text-xs ${getPriorityColor(recommendation.priority)}`}>
                      {getPriorityIcon(recommendation.priority)}
                      <span className="ml-1">{recommendation.priority}</span>
                    </Badge>
                  </div>
                  <AlertDescription className="text-sm text-gray-600 mb-2">
                    {recommendation.description}
                  </AlertDescription>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {recommendation.category}
                      </Badge>
                      <span className="text-xs text-gray-500">{recommendation.estimated_impact}</span>
                    </div>
                    {recommendation.actionable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRecommendationAction(recommendation.id, "acted_upon")}
                        className="text-xs"
                      >
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRecommendationAction(recommendation.id, "dismissed")}
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </Alert>
          ))}

          {visibleRecommendations.length > 3 && (
            <div className="text-center pt-2">
              <Button variant="outline" size="sm">
                View All Recommendations ({visibleRecommendations.length - 3} more)
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
