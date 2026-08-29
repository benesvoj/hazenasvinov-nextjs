// Helper functions (moved from client)

/**
 * Narrows attendance statistics to the members an insight or a recommendation
 * may still be raised about.
 *
 * `get_member_attendance_stats` deliberately keeps a deactivated (vyřazený)
 * member as long as they have a record, so their history stays readable. That
 * is right for the statistics table, and wrong for everything derived from it
 * that points forward: a player who left the club still scores low, so they end
 * up in "Low Attendance Alert" and in the "Contact Members" recommendation, and
 * the coach is told to ring someone who is no longer in the squad.
 *
 * History is read from the full stats; anything actionable is read from this.
 *
 * @param memberStats     Rows as returned by `get_member_attendance_stats`.
 * @param activeMemberIds Ids of the members still active in the club.
 */
function selectActionableMemberStats<T extends {member_id: string}>(
  memberStats: T[],
  activeMemberIds: Iterable<string>
): T[] {
  const active = new Set(activeMemberIds);
  return memberStats.filter((stat) => active.has(stat.member_id));
}

/**
 * @param memberStats Actionable members only — see `selectActionableMemberStats`.
 */
function generateInsights(memberStats: any[], trends: any[]) {
  const insights = [];

  // Low attendance members
  const lowAttendance = memberStats.filter((m) => m.attendance_percentage < 50);
  if (lowAttendance.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Low Attendance Alert',
      message: `${lowAttendance.length} member(s) have attendance below 50%`,
      members: lowAttendance.map((m) => `${m.member_name} ${m.member_surname}`),
    });
  }

  // High performers
  const highPerformers = memberStats.filter((m) => m.attendance_percentage >= 90);
  if (highPerformers.length > 0) {
    insights.push({
      type: 'success',
      title: 'Excellent Attendance',
      message: `${highPerformers.length} member(s) have attendance above 90%`,
      count: highPerformers.length,
    });
  }

  // Attendance trend
  if (trends.length >= 5) {
    const recent = trends.slice(-5);
    const avgRecent = recent.reduce((acc, t) => acc + t.attendance_percentage, 0) / recent.length;
    const older = trends.slice(-10, -5);
    if (older.length > 0) {
      const avgOlder = older.reduce((acc, t) => acc + t.attendance_percentage, 0) / older.length;
      const trend =
        avgRecent > avgOlder ? 'improving' : avgRecent < avgOlder ? 'declining' : 'stable';

      insights.push({
        type: trend === 'improving' ? 'success' : trend === 'declining' ? 'warning' : 'info',
        title: 'Attendance Trend',
        message: `Overall attendance is ${trend}`,
        data: {avgRecent, avgOlder, trend},
      });
    }
  }

  return insights;
}

/**
 * @param memberStats Actionable members only — see `selectActionableMemberStats`.
 */
function generateRecommendations(memberStats: any[], summary: any) {
  const recommendations = [];

  // Members needing attention
  const needsAttention = memberStats.filter(
    (m) => m.absent_count >= 3 || m.attendance_percentage < 60
  );

  if (needsAttention.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Contact Members',
      description: `Reach out to ${needsAttention.length} member(s) with low attendance`,
      members: needsAttention.slice(0, 5).map((m) => ({
        id: m.member_id,
        name: `${m.member_name} ${m.member_surname}`,
        attendance_percentage: m.attendance_percentage,
      })),
    });
  }

  // Session completion rate
  if (summary?.completion_rate < 70) {
    recommendations.push({
      priority: 'medium',
      action: 'Improve Session Completion',
      description: `Only ${summary.completion_rate}% of planned sessions were completed`,
    });
  }

  return recommendations;
}

export {generateInsights, generateRecommendations, selectActionableMemberStats};
