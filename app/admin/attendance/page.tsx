'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Copy, Search, ArrowLeft, CheckCircle, Users, Download, Eye, EyeOff, Grid3X3, Grid2X2, UserX } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { parseNameAndEmoji } from './utils/nameParser'
import { runSpeedDatingEvent } from './utils/speedDating'
import { Attendee, RoundResult } from './utils/types'

interface AttendanceRecord {
  id: string
  attendeeName: string
  preferredName: string | null
  productId: string | null
  gender: string | null
  age: number | null
  createdAt: string
}

interface EventAttendanceSummary {
  productId: string
  count: number
  attendees: AttendanceRecord[]
}

export default function AdminAttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [pairings, setPairings] = useState<RoundResult[] | null>(null)
  const [showPairings, setShowPairings] = useState(false)
  const [numRounds, setNumRounds] = useState(8)
  const [pairingLoading, setPairingLoading] = useState(false)
  const [showStatistics, setShowStatistics] = useState(true)
  const [pairingColumns, setPairingColumns] = useState(2)
  const [excludedAttendees, setExcludedAttendees] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const fetchAttendances = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/attendance')
      const data = await response.json()
      
      if (response.ok) {
        setAttendances(data.attendances || [])
      } else {
        console.error('Failed to fetch attendances:', data.error)
      }
    } catch (error) {
      console.error('Error fetching attendances:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendances()
  }, [])

  const handleRefresh = () => {
    fetchAttendances()
  }

  const handleEventClick = async (productId: string) => {
    setSelectedProductId(productId)
    // No need to fetch checkouts - we'll use the attendance records we already have
  }

  const handleBackToOverview = () => {
    setSelectedProductId(null)
    setSearchTerm('')
    setShowPairings(false)
    setPairings(null)
    setExcludedAttendees(new Set()) // Reset exclusions when going back
  }

  const getEventAttendanceSummary = (): EventAttendanceSummary[] => {
    const eventMap = new Map<string, AttendanceRecord[]>()
    
    attendances.forEach(attendance => {
      if (attendance.productId !== null) {
        if (!eventMap.has(attendance.productId)) {
          eventMap.set(attendance.productId, [])
        }
        eventMap.get(attendance.productId)!.push(attendance)
      }
    })
    
    return Array.from(eventMap.entries())
      .map(([productId, attendees]) => ({
        productId,
        count: attendees.length,
        attendees
      }))
      .sort((a, b) => a.productId.localeCompare(b.productId))
  }

  const getFilteredAttendees = () => {
    // Get attendance records for the selected event
    const eventAttendees = attendances.filter(attendance => attendance.productId === selectedProductId)
    
    if (!searchTerm) return eventAttendees.sort((a, b) => {
      const nameA = a.attendeeName.toLowerCase()
      const nameB = b.attendeeName.toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return eventAttendees
      .filter(attendance => 
        attendance.attendeeName.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const nameA = a.attendeeName.toLowerCase()
        const nameB = b.attendeeName.toLowerCase()
        return nameA.localeCompare(nameB)
      })
  }

  const copyAttendanceTable = async () => {
    const filteredAttendees = getFilteredAttendees()
    const tableData = filteredAttendees.map(attendance => {
      const { name, emoji } = parseNameAndEmoji(attendance.preferredName);
      return {
        Name: name || attendance.attendeeName,
        Emoji: emoji || 'N/A',
        Account: attendance.attendeeName,
        PreferredName: attendance.preferredName || 'N/A',
        SiteName: 'N/A',
        ProductId: attendance.productId || 'N/A',
        Gender: attendance.gender || 'N/A',
        Age: attendance.age || 'N/A',
        Date: new Date(attendance.createdAt).toLocaleDateString(),
        Time: new Date(attendance.createdAt).toLocaleTimeString()
      };
    })

    // Create tab-separated values for easy pasting into spreadsheets
    const headers = Object.keys(tableData[0] || {}).join('\t')
    const rows = tableData.map(row => Object.values(row).join('\t')).join('\n')
    const csvContent = headers + '\n' + rows

    try {
      await navigator.clipboard.writeText(csvContent)
      setCopySuccess(true)
      toast({
        title: "Copied!",
        description: "Attendance table copied to clipboard",
      })
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const generatePairings = async () => {
    if (!selectedProductId) return
    
    setPairingLoading(true)
    try {
      const eventAttendees = attendances.filter(attendance => attendance.productId === selectedProductId)
      
      // Convert attendance records to Attendee format for pairing algorithm
      const attendees: Attendee[] = eventAttendees
        .filter(attendance => attendance.gender && attendance.age) // Only include attendees with gender and age
        .filter(attendance => !excludedAttendees.has(attendance.id)) // Exclude manually excluded attendees
        .map(attendance => {
          // Keep the full name with emoji for display
          const { name, emoji } = parseNameAndEmoji(attendance.preferredName);
          const displayName = attendance.preferredName ? 
            (emoji ? `${emoji} ${name || attendance.attendeeName}` : (name || attendance.attendeeName)) :
            attendance.attendeeName;
          
          return {
            id: attendance.id,
            name: displayName, // Use the full name with emoji
            age: attendance.age!,
            gender: attendance.gender === 'male' ? 'M' : attendance.gender === 'female' ? 'F' : attendance.gender!.toUpperCase() as 'M' | 'F'
          }
        })

      if (attendees.length === 0) {
        toast({
          title: "Cannot generate pairings",
          description: "No attendees with valid gender and age information found",
          variant: "destructive",
        })
        return
      }

      const maleCount = attendees.filter(a => a.gender === 'M').length
      const femaleCount = attendees.filter(a => a.gender === 'F').length

      if (maleCount === 0 || femaleCount === 0) {
        toast({
          title: "Cannot generate pairings",
          description: "Need both male and female attendees to generate pairings",
          variant: "destructive",
        })
        return
      }

      const result = runSpeedDatingEvent(attendees, numRounds)
      setPairings(result.rounds)
      setShowPairings(true)
      
      toast({
        title: "Pairings generated!",
        description: `Generated ${numRounds} rounds for ${attendees.length} attendees`,
      })
    } catch (error) {
      console.error('Error generating pairings:', error)
      toast({
        title: "Error",
        description: "Failed to generate pairings",
        variant: "destructive",
      })
    } finally {
      setPairingLoading(false)
    }
  }

  const copyPairingsTable = async () => {
    if (!pairings) return

    const tableData: string[] = []
    
    pairings.forEach(round => {
      tableData.push(`ROUND ${round.round}`)
      tableData.push('Male\tFemale\tAge Diff\tCost')
      
      round.pairings.forEach(pairing => {
        tableData.push(`${pairing.male_name} (${pairing.male_age})\t${pairing.female_name} (${pairing.female_age})\t${pairing.age_diff}\t${pairing.cost.toFixed(2)}`)
      })
      
      if (round.byes.length > 0) {
        tableData.push('\nByes:')
        round.byes.forEach(bye => {
          tableData.push(`${bye.attendee_name}\t\t\t${bye.bye_penalty.toFixed(2)}`)
        })
      }
      
      tableData.push('') // Empty line between rounds
    })

    const csvContent = tableData.join('\n')

    try {
      await navigator.clipboard.writeText(csvContent)
      toast({
        title: "Copied!",
        description: "Pairings table copied to clipboard",
      })
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const toggleAttendeeExclusion = (attendeeId: string) => {
    setExcludedAttendees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(attendeeId)) {
        newSet.delete(attendeeId)
      } else {
        newSet.add(attendeeId)
      }
      return newSet
    })
  }

  // If showing detailed view for a specific event
  if (selectedProductId !== null) {
    const filteredAttendees = getFilteredAttendees()
    
    // If showing pairings
    if (showPairings && pairings) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 text-gray-800 font-sans">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <Button
                  onClick={() => setShowPairings(false)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Attendees
                </Button>
                <h1 className="text-4xl font-bold text-gray-800">
                  Event {selectedProductId} - Speed Dating Pairings
                </h1>
              </div>

              <Card className="p-6 bg-white/80 backdrop-blur-sm border-orange-100">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {numRounds} Rounds
                    </Badge>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {pairings.reduce((total, round) => total + round.pairings.length, 0)} Total Pairings
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border rounded-lg p-1">
                      <Button
                        onClick={() => setPairingColumns(1)}
                        variant={pairingColumns === 1 ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        1
                      </Button>
                      <Button
                        onClick={() => setPairingColumns(2)}
                        variant={pairingColumns === 2 ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        2
                      </Button>
                      <Button
                        onClick={() => setPairingColumns(3)}
                        variant={pairingColumns === 3 ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        3
                      </Button>
                      <Button
                        onClick={() => setPairingColumns(4)}
                        variant={pairingColumns === 4 ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        4
                      </Button>
                    </div>
                    <Button
                      onClick={() => setShowStatistics(!showStatistics)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      {showStatistics ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Hide Stats
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Show Stats
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={copyPairingsTable}
                      className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy All Rounds
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {pairings.map((round) => (
                    <div key={round.round} className="bg-white rounded border border-gray-200 p-3">
                      <h3 className="text-xl font-bold text-gray-800 mb-3">
                        Round {round.round}
                      </h3>
                      
                      {round.pairings.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-gray-700 mb-2">
                            Pairings ({round.pairings.length})
                          </h4>
                          <div className={`grid gap-2 ${
                            pairingColumns === 1 ? 'grid-cols-1' :
                            pairingColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
                            pairingColumns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                          }`}>
                            {round.pairings.map((pairing, index) => (
                              <div
                                key={`${pairing.male_id}-${pairing.female_id}`}
                                className="p-2 bg-blue-50 rounded border border-blue-200"
                              >
                                {/* Room number - more prominent */}
                                <div className="text-center font-bold text-blue-800 text-base mb-2 bg-blue-100 rounded py-1">
                                  Room {index + 1}
                                </div>
                                
                                {/* Horizontal pairing layout */}
                                <div className="flex items-center justify-center gap-2 text-center">
                                  {/* Person 1 */}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-800 text-base leading-tight truncate">
                                      {pairing.male_name}
                                    </div>
                                    {showStatistics && (
                                      <div className="text-xs text-gray-500">
                                        {pairing.male_age}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Heart */}
                                  <div className="text-red-500 text-lg px-1">
                                    💙
                                  </div>
                                  
                                  {/* Person 2 */}
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-800 text-base leading-tight truncate">
                                      {pairing.female_name}
                                    </div>
                                    {showStatistics && (
                                      <div className="text-xs text-gray-500">
                                        {pairing.female_age}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Statistics row */}
                                {showStatistics && (
                                  <div className="text-xs text-gray-400 mt-1 pt-1 border-t border-blue-200 text-center">
                                    Gap: {pairing.age_diff} | Cost: {pairing.cost.toFixed(0)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {round.byes.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-gray-700 mb-2">
                            Byes ({round.byes.length})
                          </h4>
                          <div className={`grid gap-2 ${
                            pairingColumns === 1 ? 'grid-cols-1' :
                            pairingColumns === 2 ? 'grid-cols-1 md:grid-cols-2' :
                            pairingColumns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                          }`}>
                            {round.byes.map((bye) => (
                              <div
                                key={bye.attendee_id}
                                className="p-2 bg-yellow-50 rounded border border-yellow-200 text-center"
                              >
                                <div className="font-bold text-yellow-800 text-xs mb-1">
                                  Sitting Out
                                </div>
                                <div className="font-semibold text-yellow-800 text-sm leading-tight">
                                  {bye.attendee_name}
                                </div>
                                {showStatistics && (
                                  <div className="text-xs text-yellow-600 mt-1 pt-1 border-t border-yellow-200">
                                    Penalty: {bye.bye_penalty.toFixed(0)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 text-gray-800 font-sans">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button
                onClick={handleBackToOverview}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Overview
              </Button>
              <h1 className="text-4xl font-bold text-gray-800">
                Event {selectedProductId} Attendance ({filteredAttendees.length})
              </h1>
            </div>

            {/* Pairing Controls */}
            <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm border-orange-100">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold text-gray-700">Speed Dating Pairings</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label htmlFor="numRounds" className="text-sm text-gray-600">Rounds:</label>
                      <Input
                        id="numRounds"
                        type="number"
                        min="1"
                        max="20"
                        value={numRounds}
                        onChange={(e) => setNumRounds(parseInt(e.target.value) || 8)}
                        className="w-20"
                      />
                    </div>
                    {excludedAttendees.size > 0 && (
                      <Badge variant="destructive" className="text-sm">
                        {excludedAttendees.size} excluded
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={generatePairings}
                  disabled={pairingLoading}
                  className="bg-purple-500 hover:bg-purple-600 flex items-center gap-2"
                >
                  {pairingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Generate Pairings
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-orange-100">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    Total: {filteredAttendees.length}
                  </Badge>
                  <Button
                    onClick={copyAttendanceTable}
                    className="bg-green-500 hover:bg-green-600 flex items-center gap-2"
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Table
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {filteredAttendees.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-600">
                    {searchTerm ? `No attendees found matching "${searchTerm}"` : 'No attendance records found for this event.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3">
                    {filteredAttendees.map((attendance, index) => (
                      <div
                        key={attendance.id}
                        className={`flex justify-between items-center p-4 rounded-lg border shadow-sm ${
                          excludedAttendees.has(attendance.id)
                            ? "bg-red-50 border-red-200" 
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {attendance.preferredName && (() => {
                              const { name, emoji } = parseNameAndEmoji(attendance.preferredName);
                              return (
                                <>
                                  <span className="text-2xl">{emoji}</span>
                                  <h4 className="font-semibold text-lg text-gray-800">
                                    {name || attendance.attendeeName}
                                  </h4>
                                </>
                              );
                            })() || (
                              <h4 className="font-semibold text-lg text-gray-800">
                                {attendance.attendeeName}
                              </h4>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Account: {attendance.attendeeName}
                            {attendance.preferredName && (() => {
                              const { name } = parseNameAndEmoji(attendance.preferredName);
                              return name ? ` | Goes by: ${name}` : '';
                            })()}
                          </p>
                          {(attendance.gender || attendance.age) && (
                            <p className="text-sm text-gray-500">
                              {attendance.gender && (
                                <span className="capitalize">{attendance.gender.replace('-', ' ')}</span>
                              )}
                              {attendance.gender && attendance.age && ' • '}
                              {attendance.age && <span>{attendance.age} years old</span>}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => toggleAttendeeExclusion(attendance.id)}
                            variant={excludedAttendees.has(attendance.id) ? "default" : "outline"}
                            size="sm"
                            className={`flex items-center gap-1 ${
                              excludedAttendees.has(attendance.id) 
                                ? "bg-red-500 hover:bg-red-600 text-white" 
                                : "text-gray-600 hover:bg-red-50 hover:text-red-600"
                            }`}
                          >
                            <UserX className="w-4 h-4" />
                            {excludedAttendees.has(attendance.id) ? "Excluded" : "Exclude"}
                          </Button>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {new Date(attendance.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(attendance.createdAt).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-gray-500">#{index + 1}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-orange-100 text-gray-800 font-sans">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-5xl md:text-6xl font-black mb-8 text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent" style={{ fontFamily: "'Inter', sans-serif" }}>
          Attendance Admin
        </h1>
        
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm border-orange-100">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-700">All Attendance Records</h2>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  Total: {attendances.length}
                </Badge>
                <Button 
                  onClick={handleRefresh}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Refresh
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading attendance data...</p>
              </div>
            ) : (
              <>
                {/* Event Summary Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4">Attendance by Event</h3>
                  {getEventAttendanceSummary().length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xl text-gray-600">No event attendance found.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {getEventAttendanceSummary().map((eventSummary) => (
                        <button
                          key={eventSummary.productId}
                          onClick={() => handleEventClick(eventSummary.productId)}
                          className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-left"
                        >
                          <h4 className="font-semibold text-lg text-blue-800">
                            Event {eventSummary.productId}
                          </h4>
                          <p className="text-sm text-blue-600">
                            {eventSummary.count} attendee{eventSummary.count !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-blue-500">
                            {eventSummary.attendees.filter(a => a.gender === 'male').length}M / {eventSummary.attendees.filter(a => a.gender === 'female').length}F
                          </p>
                          <p className="text-xs text-blue-500 mt-1">
                            Click to view details
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Raw Attendance Records Section */}
                {attendances.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold mb-4">
                      All Attendance Records ({attendances.length})
                    </h3>
                    
                    <div className="grid gap-3">
                      {attendances.map((attendance) => (
                        <div
                          key={attendance.id}
                          className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {attendance.preferredName && (() => {
                                const { name, emoji } = parseNameAndEmoji(attendance.preferredName);
                                return (
                                  <>
                                    <span className="text-2xl">{emoji}</span>
                                    <h4 className="font-semibold text-lg text-gray-800">
                                      {name || attendance.attendeeName}
                                    </h4>
                                  </>
                                );
                              })() || (
                                <h4 className="font-semibold text-lg text-gray-800">
                                  {attendance.attendeeName}
                                </h4>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              Account: {attendance.attendeeName}
                              {attendance.preferredName && (() => {
                                const { name } = parseNameAndEmoji(attendance.preferredName);
                                return name ? ` | Goes by: ${name}` : '';
                              })()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Product: {attendance.productId}
                            </p>
                            {(attendance.gender || attendance.age) && (
                              <p className="text-sm text-gray-500">
                                {attendance.gender && (
                                  <span className="capitalize">{attendance.gender.replace('-', ' ')}</span>
                                )}
                                {attendance.gender && attendance.age && ' • '}
                                {attendance.age && <span>{attendance.age} years old</span>}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {new Date(attendance.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(attendance.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
