// Helper functions (moved from client)
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

export {generateInsights, generateRecommendations};
