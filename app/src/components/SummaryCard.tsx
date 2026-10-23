import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LoanSummary } from '../api/loans.api';

interface SummaryCardProps {
  summary: LoanSummary | null;
  isLoading: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, isLoading }) => {
  const formatCurrency = (amount: number = 0) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalLent = summary?.totalLent ?? 0;
  const totalRepaid = summary?.totalRepaid ?? 0;
  const overdueAmount = summary?.overdueAmount ?? 0;
  const activeBalance = Math.max(0, totalLent - totalRepaid);

  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Financial Overview</Text>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>
            Outstanding: {formatCurrency(activeBalance)}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {/* Total Lent */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Lent</Text>
          <Text style={[styles.statValue, styles.lentColor]}>
            {isLoading ? '...' : formatCurrency(totalLent)}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.verticalDivider} />

        {/* Total Repaid */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Repaid</Text>
          <Text style={[styles.statValue, styles.repaidColor]}>
            {isLoading ? '...' : formatCurrency(totalRepaid)}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.verticalDivider} />

        {/* Overdue Amount */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Overdue</Text>
          <Text style={[styles.statValue, styles.overdueColor]}>
            {isLoading ? '...' : formatCurrency(overdueAmount)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0F172A', // Slate-900
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#94A3B8', // Slate-400
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  activePill: {
    backgroundColor: '#1E293B', // Slate-800
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activePillText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#334155',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  lentColor: {
    color: '#38BDF8', // Sky-400
  },
  repaidColor: {
    color: '#4ADE80', // Emerald-400
  },
  overdueColor: {
    color: '#F87171', // Red-400
  },
});
