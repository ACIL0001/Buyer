'use client';

import React, { useState } from 'react';
import {
  Card,
  Table,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TextField,
  Box,
  InputAdornment,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  useMediaQuery,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider,
  TableHead,
  TableSortLabel,
  TableBody as MuiTableBody,
} from '@mui/material';
import { MdSearch, MdExpandMore } from 'react-icons/md';

// Helper functions
export function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

export function getComparator<T>(
  order: 'asc' | 'desc',
  orderBy: keyof T
): (a: T, b: T) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export function applySortFilter<T>(
  array: T[],
  comparator: (a: T, b: T) => number,
  query: string,
  searchFields: string[] = []
): T[] {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  const sortedArray = stabilizedThis.map((el) => el[0]);

  if (query && searchFields.length > 0) {
    return sortedArray.filter((obj) => {
      return searchFields.some(field => {
        const value = field.split('.').reduce((acc: any, part) => acc && acc[part], obj);
        if (value == null) return false;
        
        const stringValue = String(value).toLowerCase();
        const searchQuery = query.toLowerCase().trim();
        
        return stringValue.includes(searchQuery);
      });
    });
  }

  return sortedArray;
}

import { useTranslation } from 'react-i18next';

// Mobile Card Component
const MobileCard = ({ row, columns, onRowClick }: any) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();

  const handleClick = () => {
    if (onRowClick) {
      onRowClick(row);
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        cursor: onRowClick ? 'pointer' : 'default',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.35))'
          : 'linear-gradient(135deg, rgba(30,30,30,0.6), rgba(30,30,30,0.35))',
        backdropFilter: 'saturate(140%) blur(10px)',
        WebkitBackdropFilter: 'saturate(140%) blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        '&:hover': {
          boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
          transform: 'translateY(-3px)',
        },
      }}
      onClick={handleClick}
    >
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {columns.slice(0, 2).map((column: any, index: number) => {
            const value = column.id.split('.').reduce((acc: any, part: string) => acc && acc[part], row);
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={index}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {column.label}
                </Typography>
                <Typography variant="body2" noWrap>
                  {typeof value === 'object' && value !== null ? '-' : (value || '-')}
                </Typography>
              </Grid>
            );
          })}
        </Grid>
        
        {columns.length > 2 && (
          <Accordion 
            expanded={expanded} 
            onChange={() => setExpanded(!expanded)}
            sx={{ 
              boxShadow: 'none',
              '&:before': { display: 'none' },
              mt: 1
            }}
          >
            <AccordionSummary
              expandIcon={<MdExpandMore />}
              sx={{ 
                minHeight: 'auto',
                py: 0,
                '& .MuiAccordionSummary-content': {
                  margin: 0,
                }
              }}
            >
              <Typography variant="caption" color="primary">
                {expanded ? t('common.showLess') : t('common.showMore')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 1, pb: 0 }}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {columns.slice(2).map((column: any, index: number) => {
                  const value = column.id.split('.').reduce((acc: any, part: string) => acc && acc[part], row);
                  return (
                    <Grid size={{ xs: 12, sm: 6 }} key={index}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {column.label}
                      </Typography>
                      <Typography variant="body2" noWrap>
                        {typeof value === 'object' && value !== null ? '-' : (value || '-')}
                      </Typography>
                    </Grid>
                  );
                })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    </Card>
  );
};

// Table Head Component
const TableHeadComponent = ({ columns, order, orderBy, onRequestSort }: any) => {
  const createSortHandler = (property: string) => (event: React.MouseEvent) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {columns.map((column: any) => (
          <TableCell
            key={column.id}
            align={column.alignRight ? 'right' : 'left'}
            sortDirection={orderBy === column.id ? order : false}
          >
            {column.sortable !== false ? (
              <TableSortLabel
                active={orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                onClick={createSortHandler(column.id)}
              >
                {column.label}
              </TableSortLabel>
            ) : (
              column.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

interface ResponsiveTableProps<T> {
  data: T[];
  columns: any[];
  TableBody: React.ComponentType<{ data: T[] }>;
  page: number;
  setPage: (page: number) => void;
  order: 'asc' | 'desc';
  setOrder: (order: 'asc' | 'desc') => void;
  orderBy: string;
  setOrderBy: (orderBy: string) => void;
  filterName: string;
  setFilterName: (name: string) => void;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
  searchFields?: string[];
  selected: string[];
  setSelected: (selected: string[]) => void;
  onRowClick?: (row: T) => void;
}

export default function ResponsiveTable<T>({
  data,
  columns,
  TableBody,
  page,
  setPage,
  order,
  setOrder,
  orderBy,
  setOrderBy,
  filterName,
  setFilterName,
  rowsPerPage,
  setRowsPerPage,
  searchFields = [],
  selected,
  setSelected,
  onRowClick
}: ResponsiveTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { t } = useTranslation();

  // Get searchable fields from columns
  const allSearchFields = columns
    .filter(col => col.searchable !== false)
    .map(col => col.id);

  const defaultSearchField = allSearchFields[0] || '';
  const [searchField, setSearchField] = useState(defaultSearchField);

  const handleRequestSort = (event: React.MouseEvent, property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterByName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterName(event.target.value);
    setPage(0);
  };

  const filteredData = applySortFilter(
    data, 
    getComparator(order, orderBy as keyof T), 
    filterName, 
    searchFields.length > 0 ? searchFields : [searchField]
  );

  const isDataNotFound = filteredData.length === 0;

  // Mobile View
  if (isMobile) {
    return (
      <Card
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          background: theme.palette.mode === 'light' 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.35))'
            : 'linear-gradient(135deg, rgba(25,25,25,0.65), rgba(25,25,25,0.35))',
          backdropFilter: 'saturate(150%) blur(12px)',
          WebkitBackdropFilter: 'saturate(150%) blur(12px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
        }}
      >
        {/* Search Section */}
        <Box
          sx={{
            p: 2,
            background: theme.palette.mode === 'light'
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.02)})`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)}, ${alpha(theme.palette.primary.main, 0.06)})`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Stack spacing={2}>
            <TextField
              fullWidth
              value={filterName}
              onChange={handleFilterByName}
              placeholder={t('common.search')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MdSearch size={20} color={theme.palette.text.disabled} />
                  </InputAdornment>
                ),
              }}
            />
            {allSearchFields.length > 1 && (
              <FormControl fullWidth>
                <InputLabel>{t('common.searchIn')}</InputLabel>
                <Select
                  value={searchField}
                  onChange={(e) => {
                    setSearchField(e.target.value);
                    setPage(0);
                  }}
                  label={t('common.searchIn')}
                >
                  {allSearchFields.map((field) => {
                    const column = columns.find(col => col.id === field);
                    return (
                      <MenuItem key={field} value={field}>
                        {column?.label || field.split('.')[0]}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            )}
          </Stack>
        </Box>

        {/* Mobile Cards */}
        <Box sx={{ p: 2 }}>
          {isDataNotFound ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {t('common.noResults')} "{filterName}"
              </Typography>
            </Box>
          ) : (
            filteredData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <MobileCard
                  key={(row as any)._id || index}
                  row={row}
                  columns={columns}
                  onRowClick={onRowClick}
                />
              ))
          )}
        </Box>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    );
  }

  // Desktop View
  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.65), rgba(255,255,255,0.35))'
          : 'linear-gradient(135deg, rgba(25,25,25,0.65), rgba(25,25,25,0.35))',
        backdropFilter: 'saturate(150%) blur(12px)',
        WebkitBackdropFilter: 'saturate(150%) blur(12px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
      }}
    >
      <Box
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          gap: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
          background: theme.palette.mode === 'light'
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.main, 0.02)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)}, ${alpha(theme.palette.primary.main, 0.06)})`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 2, sm: 2 }} 
          alignItems="center" 
          flex={1}
          sx={{ width: '100%' }}
        >
          <TextField
            fullWidth
            value={filterName}
            onChange={handleFilterByName}
            placeholder={t('common.search')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MdSearch size={20} color={theme.palette.text.disabled} />
                </InputAdornment>
              ),
            }}
            sx={{
              maxWidth: { sm: 280, md: 320 },
            }}
          />
          {allSearchFields.length > 1 && (
            <FormControl 
              sx={{ 
                minWidth: { xs: '100%', sm: 180, md: 200 },
              }}
            >
              <InputLabel>{t('common.searchIn')}</InputLabel>
              <Select
                value={searchField}
                onChange={(e) => {
                  setSearchField(e.target.value);
                  setPage(0);
                }}
                label={t('common.searchIn')}
              >
                {allSearchFields.map((field) => {
                  const column = columns.find(col => col.id === field);
                  return (
                    <MenuItem key={field} value={field}>
                      {column?.label || field.split('.')[0]}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          )}
        </Stack>
      </Box>

      <TableContainer sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHeadComponent
            columns={columns}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
          />
          {TableBody && <TableBody data={filteredData} />}

          {isDataNotFound && (
            <MuiTableBody>
              <TableRow>
                <TableCell 
                  align="center" 
                  colSpan={columns.length} 
                  sx={{ py: 3 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t('common.noResults')} "{filterName}"
                  </Typography>
                </TableCell>
              </TableRow>
            </MuiTableBody>
          )}
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Card>
  );
}
