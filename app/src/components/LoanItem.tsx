import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Loan } from '../api/loans.api';

interface LoanItemProps {
  loan: Loan;
  onRepay: (id: number) => void;
  onViewReceipt: (url: string) => void;
  isRepaying: boolean;
}

export const LoanItem: React.FC<LoanItemProps> = ({
  loan,
  onRepay,
  onViewReceipt,
  isRepaying,
}) => {
  const isRepaid = loan.status === 'repaid';
  const isOverdue = loan.isOverdue && !isRepaid;

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Determine card style based on status
  const cardStyle = [
    styles.card,
    isOverdue && styles.overdueCard,
    isRepaid && styles.repaidCard,
  ];

  return (
    <View style={cardStyle}>
      <View style={styles.topRow}>
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, isRepaid && styles.mutedText]}>
            {loan.friendName}
          </Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Due: </Text>
            <Text style={[styles.dateValue, isOverdue && styles.overdueDateText, isRepaid && styles.mutedText]}>
              {formatDate(loan.dueDate)}
            </Text>
          </View>
        </View>

        {/* Amount & Status Badge */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amountText, isRepaid && styles.repaidAmountText]}>
            {formatCurrency(loan.amount)}
          </Text>

          {/* Status Badge */}
          {isOverdue && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueBadgeText}>OVERDUE</Text>
            </View>
          )}

          {isRepaid && (
            <View style={styles.repaidBadge}>
              <Text style={styles.repaidBadgeText}>REPAID</Text>
            </View>
          )}

          {!isOverdue && !isRepaid && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>PENDING</Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer / Actions */}
      <View style={styles.footerRow}>
        {/* Receipt Button if attached */}
        {loan.receiptUrl ? (
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={() => onViewReceipt(loan.receiptUrl!)}
            activeOpacity={0.7}
          >
            <Text style={styles.receiptButtonText}>📎 View Receipt</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {/* Mark as Repaid Button */}
        {!isRepaid ? (
          <TouchableOpacity
            style={[styles.repayButton, isRepaying && styles.buttonDisabled]}
            onPress={() => onRepay(loan.id)}
            disabled={isRepaying}
            activeOpacity={0.8}
          >
            {isRepaying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.repayButtonText}>✓ Mark as Repaid</Text>
            )}
          </TouchableOpacity>
        ) : (
          <Text style={styles.repaidDateSubtext}>
            Repaid on {formatDate(loan.repaidAt ? loan.repaidAt.split('T')[0] : '')}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0', // Slate-200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  // Overdue: Highlighted with red background and red border
  overdueCard: {
    backgroundColor: '#FEF2F2', // Light Red / Rose tint
    borderColor: '#EF4444', // Red-500
    borderWidth: 1.5,
  },
  // Repaid: Muted appearance
  repaidCard: {
    backgroundColor: '#F8FAFC', // Slate-50
    borderColor: '#E2E8F0',
    opacity: 0.78,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  friendInfo: {
    flex: 1,
    marginRight: 12,
  },
  friendName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  overdueDateText: {
    color: '#DC2626',
    fontWeight: '700',
  },
  mutedText: {
    color: '#94A3B8',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  repaidAmountText: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  overdueBadge: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  overdueBadgeText: {
    color: '#B91C1C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  repaidBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  repaidBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pendingBadge: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingBadgeText: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  receiptButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  receiptButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  repayButton: {
    backgroundColor: '#10B981', // Emerald-500
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  repaidDateSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
