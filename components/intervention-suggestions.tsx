'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from './ui/shadcn-io/spinner' // You'll need to create this component
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

export function GenerateInterventionButton({ student, onSuggestionsGenerated }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [specificConcern, setSpecificConcern] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [error, setError] = useState('')

  const generateSuggestions = async () => {
    if (!student?.id) {
      setError('No student selected')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          specificConcern,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      onSuggestionsGenerated(data.suggestions);
    } catch (err) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'An error occurred while generating suggestions'
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline" 
        size="sm" 
        className="text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        Generate AI Suggestions
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate AI Intervention Suggestions</DialogTitle>
            <DialogDescription>
              Our AI will analyze {student?.full_name || 'this student'}'s data and provide personalized intervention recommendations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specific Concerns (Optional)
              </label>
              <Textarea 
                placeholder="Enter any specific concerns or areas to focus on..."
                value={specificConcern}
                onChange={(e) => setSpecificConcern(e.target.value)}
                className="h-24"
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {suggestions.length > 0 && (
              <div className="mb-4 space-y-4">
                <h4 className="font-medium text-gray-900">AI-Generated Suggestions:</h4>
                
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge className="mb-1">
                            {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                          </Badge>
                          <CardTitle className="text-base">{suggestion.title}</CardTitle>
                        </div>
                        <Badge variant={
                          suggestion.urgency === 'immediate' ? 'destructive' : 
                          suggestion.urgency === 'soon' ? 'outline' : 'secondary'
                        }>
                          {suggestion.urgency.charAt(0).toUpperCase() + suggestion.urgency.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2 text-sm">
                      <p>{suggestion.description}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        <p><strong>Approach:</strong> {suggestion.approach}</p>
                        <p><strong>Expected Outcome:</strong> {suggestion.expected_outcome}</p>
                        <p><strong>Follow-up:</strong> {suggestion.follow_up}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={generateSuggestions} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner className="mr-2" />
                  Analyzing...
                </>
              ) : (
                'Generate Suggestions'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function InterventionSuggestionsCard({ suggestions, onImplement }: any) {
  return (
    <Card className="border-0 shadow-lg mb-6">
      <CardHeader className="bg-blue-50 border-b border-blue-100">
        <div className="flex justify-between">
          <div>
            <CardTitle>AI-Generated Intervention Suggestions</CardTitle>
            <CardDescription>
              Personalized recommendations based on student data analysis
            </CardDescription>
          </div>
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {suggestions.map((suggestion: any, index: number) => (
            <div key={index} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={
                    suggestion.type === 'attendance' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                    suggestion.type === 'academic' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                    suggestion.type === 'personal' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                    'bg-green-100 text-green-800 hover:bg-green-200'
                  }>
                    {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                  </Badge>
                  <h3 className="font-medium text-gray-900">{suggestion.title}</h3>
                </div>
                <Badge variant={
                  suggestion.urgency === 'immediate' ? 'destructive' : 
                  suggestion.urgency === 'soon' ? 'outline' : 'secondary'
                }>
                  {suggestion.urgency.charAt(0).toUpperCase() + suggestion.urgency.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>
              <div className="flex justify-end">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onImplement(suggestion)}
                >
                  Implement Suggestion
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 border-t px-4 py-3">
        <p className="text-xs text-gray-500">
          These suggestions are generated by Grok AI based on student data analysis. Use your professional judgment when implementing.
        </p>
      </CardFooter>
    </Card>
  )
}