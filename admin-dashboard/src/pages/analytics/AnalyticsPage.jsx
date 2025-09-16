import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../../utils/api';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Chip,
  Stack,
  Divider,
  Skeleton
} from '@mui/material';

const AnalyticsPage = () => {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchData = async (pageIdx = page, pageSize = limit) => {
    try {
      setLoading(true);
      setError('');
      const res = await analyticsApi.approvedVendors(pageIdx + 1, pageSize);
      setRows(res.data?.vendors || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(0, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setSummaryLoading(true);
        const res = await analyticsApi.summary();
        setSummary(res.data?.summary || null);
      } catch (e) {
        // Show non-blocking error, don't override table error
        console.error('Failed to load analytics summary', e);
      } finally {
        setSummaryLoading(false);
      }
    };
    loadSummary();
  }, []);

  const handleChangePage = (_e, newPage) => {
    setPage(newPage);
    fetchData(newPage, limit);
  };

  const handleChangeRowsPerPage = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setLimit(newLimit);
    setPage(0);
    fetchData(0, newLimit);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Analytics</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Summary</Typography>
        {summaryLoading && (
          <Stack spacing={1} direction="row" useFlexGap flexWrap="wrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={80} width={220} />
            ))}
          </Stack>
        )}
        {!summaryLoading && summary && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
              <SummaryCard title="Total Users" value={summary.users?.total} />
              <SummaryCard title="Clients" value={summary.users?.byType?.client} />
              <SummaryCard title="Vendors" value={summary.vendors?.total} />
              <SummaryCard title="Approved Vendors" value={summary.vendors?.approvedActive} />
              <SummaryCard title="Products" value={summary.products?.total} />
              <SummaryCard title="Orders" value={summary.orders?.total} />
              <SummaryCard title="Orders Completed" value={summary.orders?.byStatus?.completed} />
              <SummaryCard title="Wallet Total Balance" value={(summary.financials?.wallets?.totalBalance || 0).toFixed(2)} prefix="$" />
              <SummaryCard title="Tx Credit Sum" value={(summary.financials?.transactions?.creditSum || 0).toFixed(2)} prefix="$" />
              <SummaryCard title="Tx Debit Sum" value={(summary.financials?.transactions?.debitSum || 0).toFixed(2)} prefix="$" />
              <SummaryCard title="Refunds Completed" value={summary.financials?.refunds?.completed} />
              <SummaryCard title="Cashouts Pending" value={summary.financials?.cashouts?.pending} />
              <SummaryCard title="Deliveries" value={summary.deliveries?.total} />
              <SummaryCard title="Complaints" value={summary.complaints?.total} />
              <SummaryCard title="Drivers Available" value={summary.drivers?.byStatus?.available} />
            </Stack>
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Approved Vendors</Typography>
        <Typography variant="body2" color="text.secondary">
          List of approved and active vendors with wallet balance and cashout stats.
        </Typography>
      </Paper>

      <Paper>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={36} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell align="right">Wallet Balance</TableCell>
                  <TableCell align="center">Cashouts</TableCell>
                  <TableCell align="right">Cashout Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>
                      <Chip size="small" label={r.type} color={r.type === 'business' ? 'primary' : 'default'} />
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0}>
                        <Typography variant="body2">{r.user?.name || '-'}</Typography>
                        <Typography variant="caption" color="text.secondary">{r.user?.email || r.user?.phone_number || ''}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{(r.wallet?.balance || 0).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} divider={<Divider orientation="vertical" flexItem />} justifyContent="center">
                        <Chip size="small" label={`All ${r.cashouts?.total || 0}`} />
                        <Chip size="small" color="warning" label={`Pending ${r.cashouts?.pending || 0}`} />
                        <Chip size="small" color="success" label={`Approved ${r.cashouts?.approved || 0}`} />
                        <Chip size="small" color="error" label={`Rejected ${r.cashouts?.rejected || 0}`} />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">{(r.cashouts?.totalAmount || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>No approved vendors found.</Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mt: 2, borderLeft: '4px solid #c62828', background: '#fdecea' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
    </Box>
  );
};

// Small summary KPI card component
const SummaryCard = ({ title, value, prefix }) => (
  <Paper sx={{ p: 2, width: 220 }}>
    <Typography variant="body2" color="text.secondary">{title}</Typography>
    <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 600 }}>
      {prefix}{value ?? 0}
    </Typography>
  </Paper>
);

export default AnalyticsPage;

