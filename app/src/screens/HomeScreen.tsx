import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  Loan,
  LoanSummary,
  getLoansApi,
  getLoanSummaryApi,
  repayLoanApi,
} from '../api/loans.api';
import { SummaryCard } from '../components/SummaryCard';
import { LoanItem } from '../components/LoanItem';
import { ReceiptModal } from '../components/ReceiptModal';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [repayingLoanId, setRepayingLoanId] = useState<number | null>(null);

  // Selected receipt for modal inspection
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  // Fetch all loans & summary in parallel
  const fetchData = useCallback(async () => {
    try {
      const [loansData, summaryData] = await Promise.all([
        getLoansApi(),
        getLoanSummaryApi(),
      ]);
      setLoans(loansData);
      setSummary(summaryData);
    } catch (error: any) {
      console.error('Error fetching ledger data:', error);
      Alert.alert('Network Error', error.message || 'Could not load your ledger data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch on screen mount and listen for navigation focus (refresh after adding loan)
  useEffect(() => {
    fetchData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData]);

  // Pull-to-refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Mark loan as repaid
  const handleRepay = async (loanId: number) => {
    Alert.alert(
      'Confirm Repayment',
      'Are you sure this friend has repaid this loan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Repaid',
          style: 'default',
          onPress: async () => {
            setRepayingLoanId(loanId);
            try {
              const updatedLoan = await repayLoanApi(loanId);
              // Optimistically update list in state
              setLoans((prev) =>
                prev.map((l) => (l.id === loanId ? updatedLoan : l))
              );
              // Refetch summary calculations
              const updatedSummary = await getLoanSummaryApi();
              setSummary(updatedSummary);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to mark loan as repaid.');
            } finally {
              setRepayingLoanId(null);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of MiniLedger?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBrand}>MiniLedger</Text>
          <Text style={styles.headerUserPhone}>{user?.phone || 'My Account'}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addNavButton}
            onPress={() => navigation.navigate('AddLoan')}
            activeOpacity={0.8}
          >
            <Text style={styles.addNavButtonText}>+ New Loan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#38BDF8" />
          <Text style={styles.loadingText}>Loading ledger records...</Text>
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#38BDF8"
              colors={['#38BDF8']}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Financial Summary Card */}
              <SummaryCard summary={summary} isLoading={isLoading} />

              {/* List Section Header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Loan History</Text>
                <Text style={styles.sectionCount}>
                  {loans.length} {loans.length === 1 ? 'entry' : 'entries'}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <LoanItem
              loan={item}
              onRepay={handleRepay}
              onViewReceipt={(url) => setViewingReceiptUrl(url)}
              isRepaying={repayingLoanId === item.id}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyIconText}>🤝</Text>
              </View>
              <Text style={styles.emptyTitle}>No loans recorded yet</Text>
              <Text style={styles.emptySubtitle}>
                Keep track of money you lend to friends and stay on top of overdue debts.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('AddLoan')}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyButtonText}>+ Add Your First Loan</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Receipt Inspection Modal */}
      <ReceiptModal
        visible={!!viewingReceiptUrl}
        receiptUrl={viewingReceiptUrl}
        onClose={() => setViewingReceiptUrl(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate-50 background
  },
  header: {
    backgroundColor: '#0F172A', // Slate-900
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerBrand: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerUserPhone: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addNavButton: {
    backgroundColor: '#38BDF8', // Sky-400
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addNavButtonText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
