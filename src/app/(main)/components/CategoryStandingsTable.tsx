import { Card, CardHeader, CardBody } from '@heroui/react';
import { TrophyIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

// Helper function to get short name for clubs
function getShortName(fullName: string): string {
    // Common patterns for Czech club names
    if (fullName.includes('TJ Sokol')) {
      return fullName.replace('TJ Sokol ', '');
    }
    if (fullName.includes('TJ ')) {
      return fullName.replace('TJ ', '');
    }
    if (fullName.includes('SK ')) {
      return fullName.replace('SK ', '');
    }
    if (fullName.includes('HC ')) {
      return fullName.replace('HC ', '');
    }
    if (fullName.includes('FK ')) {
      return fullName.replace('FK ', '');
    }
    // If no pattern matches, return first two words or full name if short
    const words = fullName.split(' ');
    if (words.length > 2) {
      return words.slice(0, 2).join(' ');
    }
    return fullName;
  }

export default function CategoryStandingsTable({standings, standingsLoading}: {standings: any[], standingsLoading: boolean}) {
    return (
        <div>
            <Card>
              <CardHeader className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-yellow-600" />
                  <div>
                    <h3 className="text-xl font-semibold">Tabulka</h3>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {standingsLoading ? (
                  <div className="text-center py-8">Načítání...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-1 lg:px-2 text-xs lg:text-sm">Poz.</th>
                          <th className="text-left py-2 px-1 lg:px-2 text-xs lg:text-sm">Tým</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">Z</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">V</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">R</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">P</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">Skóre</th>
                          <th className="text-center py-2 px-1 lg:px-2 text-xs lg:text-sm">Body</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((team, index) => (
                          <tr key={index} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            team.is_own_club 
                              ? 'bg-blue-50 dark:bg-blue-900/20' 
                              : ''
                          }`}>
                            <td className="py-2 px-1 lg:px-2 font-semibold text-xs lg:text-sm">{team.position}.</td>
                            <td className="py-2 px-1 lg:px-2 font-medium">
                              <div className="flex items-center gap-1 lg:gap-2">
                                {/* Logo - Hidden on mobile */}
                                {team.team_logo && (
                                  <div className="hidden lg:block">
                                    <Image 
                                      src={team.team_logo} 
                                      alt={`${team.team} logo`}
                                      width={24}
                                      height={24}
                                      className="w-6 h-6 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                <span className={`text-xs lg:text-base ${team.is_own_club ? 'font-bold text-blue-700 dark:text-blue-300' : ''}`}>
                                  {/* Mobile: Short name, Desktop: Full name */}
                                  <span className="lg:hidden">{getShortName(team.team)}</span>
                                  <span className="hidden lg:inline">{team.team}</span>
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-1 lg:px-2 text-center text-xs lg:text-sm">{team.matches}</td>
                            <td className="py-2 px-1 lg:px-2 text-center text-green-600 text-xs lg:text-sm">{team.wins}</td>
                            <td className="py-2 px-1 lg:px-2 text-center text-yellow-600 text-xs lg:text-sm">{team.draws}</td>
                            <td className="py-2 px-1 lg:px-2 text-center text-red-600 text-xs lg:text-sm">{team.losses}</td>
                            <td className="py-2 px-1 lg:px-2 text-center text-xs lg:text-sm">{team.goals_for}:{team.goals_against}</td>
                            <td className={`py-2 px-1 lg:px-2 text-center font-bold text-xs lg:text-sm ${team.is_own_club ? 'text-blue-700 dark:text-blue-300' : ''}`}>{team.points}</td>
                          </tr>
                        ))}
                        {standings.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-gray-500">
                              <div className="mb-2">Žádná data pro tabulku</div>
                              <div className="text-sm text-gray-400">
                                Pro vybranou kategorii a sezónu nejsou k dispozici žádná data
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
    )
}