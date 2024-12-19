import { useState, useEffect } from 'react'
import {
  Paper,
  Text,
  Group,
  Stack,
  ThemeIcon,
  Grid,
  Table,
  Badge,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconChartBar, IconArrowUp, IconArrowDown } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'
import classes from '../styles/Paper.module.css'

const expenseTypeLabels = {
  maintenance: 'Bakım',
  repair: 'Onarım',
  insurance: 'Sigorta',
  tax: 'Vergi',
  other: 'Diğer',
}

export default function FinancialReport() {
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinancialData()
  }, [])

  const fetchFinancialData = async () => {
    try {
      // Gelirleri al (araç satışları)
      const { data: salesData, error: salesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'sold')
        .order('sale_date', { ascending: false })

      if (salesError) throw salesError

      // Giderleri al
      const { data: expensesData, error: expensesError } = await supabase
        .from('vehicle_expenses')
        .select('*')
        .order('expense_date', { ascending: false })

      if (expensesError) throw expensesError

      setIncomes(salesData)
      setExpenses(expensesData)
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Finansal veriler yüklenirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const totalIncome = incomes.reduce((sum, income) => sum + income.sale_price, 0)
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const netIncome = totalIncome - totalExpense

  return (
    <Stack spacing="lg" style={{ margin: 0, padding: 0 }}>
      <Group position="apart">
        <Group spacing="xs">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'teal', to: 'lime' }}>
            <IconChartBar size={20} />
          </ThemeIcon>
          <Text size="xl" weight={600}>Finansal Rapor</Text>
        </Group>
      </Group>

      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Paper 
            p="md" 
            radius="md" 
            withBorder 
            className={classes.paper}
          >
            <Group position="apart">
              <Text size="lg" weight={500} color="teal">
                Toplam Gelir
              </Text>
              <ThemeIcon color="teal" variant="light" size="xl">
                <IconArrowUp size={20} />
              </ThemeIcon>
            </Group>
            <Text size="xl" weight={700} color="teal" mt="sm">
              {totalIncome.toLocaleString('tr-TR')} ₺
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Paper 
            p="md" 
            radius="md" 
            withBorder 
            className={classes.paper}
          >
            <Group position="apart">
              <Text size="lg" weight={500} color="red">
                Toplam Gider
              </Text>
              <ThemeIcon color="red" variant="light" size="xl">
                <IconArrowDown size={20} />
              </ThemeIcon>
            </Group>
            <Text size="xl" weight={700} color="red" mt="sm">
              {totalExpense.toLocaleString('tr-TR')} ₺
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 4 }}>
          <Paper 
            p="md" 
            radius="md" 
            withBorder 
            className={classes.paper}
          >
            <Group position="apart">
              <Text size="lg" weight={500} color={netIncome >= 0 ? 'teal' : 'red'}>
                Net Kazanç
              </Text>
              <ThemeIcon 
                color={netIncome >= 0 ? 'teal' : 'red'} 
                variant="light" 
                size="xl"
              >
                {netIncome >= 0 ? <IconArrowUp size={20} /> : <IconArrowDown size={20} />}
              </ThemeIcon>
            </Group>
            <Text 
              size="xl" 
              weight={700} 
              color={netIncome >= 0 ? 'teal' : 'red'} 
              mt="sm"
            >
              {netIncome.toLocaleString('tr-TR')} ₺
            </Text>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper 
            p="md" 
            radius="md" 
            withBorder 
            className={classes.paper}
          >
            <Text weight={500} size="lg" mb="md">Gelirler</Text>
            <Table highlightOnHover>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Araç</th>
                  <th>Tutar</th>
                </tr>
              </thead>
              <tbody style={{ textAlign: 'center' }}>
                {incomes.map((income) => (
                  <tr key={income.id}>
                    <td>{dayjs(income.sale_date).format('DD.MM.YYYY')}</td>
                    <td>{income.brand} {income.model}</td>
                    <td>{income.sale_price.toLocaleString('tr-TR')} ₺</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper 
            p="md" 
            radius="md" 
            withBorder 
            className={classes.paper}
          >
            <Text weight={500} size="lg" mb="md">Giderler</Text>
            <Table highlightOnHover>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Tür</th>
                  <th>Açıklama</th>
                  <th>Tutar</th>
                </tr>
              </thead>
              <tbody style={{ textAlign: 'center' }}>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{dayjs(expense.expense_date).format('DD.MM.YYYY')}</td>
                    <td>
                      <Badge>
                        {expenseTypeLabels[expense.expense_type]}
                      </Badge>
                    </td>
                    <td>{expense.description}</td>
                    <td>{expense.amount.toLocaleString('tr-TR')} ₺</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  )
} 