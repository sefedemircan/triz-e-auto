import { useState, useEffect } from 'react'
import { Paper, Text, Group, Grid, Stack, Badge } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'
import { IconCar, IconCalendar } from '@tabler/icons-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    inMaintenanceVehicles: 0,
    soldVehicles: 0,
    totalEmployees: 0,
    totalExpenses: 0,
    totalSales: 0,
    monthlyExpenses: 0,
    monthlySales: 0,
    recentSales: [],
    upcomingSalaries: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Araç istatistikleri
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')

      const { data: employees } = await supabase
        .from('employees')
        .select('*')

      const { data: expenses } = await supabase
        .from('vehicle_expenses')
        .select('*')

      // Bu ayın başlangıç ve bitiş tarihleri
      const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD')
      const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD')

      // Son satışlar (son 5)
      const { data: recentSales } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'sold')
        .order('sale_date', { ascending: false })
        .limit(5)

      // Yaklaşan maaş ödemeleri
      const upcomingSalaries = employees.map(employee => ({
        ...employee,
        nextPayment: dayjs()
          .date(employee.salary_day)
          .format('DD.MM.YYYY'),
        totalCost: employee.salary + (employee.insurance_amount || 0) + (employee.food_allowance || 0)
      }))
      .sort((a, b) => a.salary_day - b.salary_day)

      setStats({
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter(v => v.status === 'available').length,
        inMaintenanceVehicles: vehicles.filter(v => v.status === 'in_maintenance').length,
        soldVehicles: vehicles.filter(v => v.status === 'sold').length,
        totalEmployees: employees.length,
        totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        totalSales: vehicles
          .filter(v => v.status === 'sold')
          .reduce((sum, v) => sum + (v.sale_price - v.purchase_price), 0),
        monthlyExpenses: expenses
          .filter(exp => exp.expense_date >= startOfMonth && exp.expense_date <= endOfMonth)
          .reduce((sum, exp) => sum + exp.amount, 0),
        monthlySales: vehicles
          .filter(v => v.status === 'sold' && v.sale_date >= startOfMonth && v.sale_date <= endOfMonth)
          .reduce((sum, v) => sum + (v.sale_price - v.purchase_price), 0),
        recentSales,
        upcomingSalaries
      })

    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Veriler yüklenirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  return (
    <Stack spacing="lg">
      <Group position="apart">
        <Text size="xl" weight={600} color="indigo">Genel Bakış</Text>
        <Text size="sm" color="dimmed">{dayjs().format('DD MMMM YYYY')}</Text>
      </Group>
      
      <Grid>
        <Grid.Col span={3}>
          <Paper p="xl" className="stat-card">
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">{stats.totalVehicles}</Badge>
            </Group>
            <Text size="sm" color="dimmed">Toplam Araç</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={3}>
          <Paper p="xl" className="stat-card">
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">{stats.availableVehicles}</Badge>
            </Group>
            <Text size="sm" color="dimmed">Satışta</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={3}>
          <Paper p="xl" className="stat-card">
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">{stats.inMaintenanceVehicles}</Badge>
            </Group>
            <Text size="sm" color="dimmed">Bakımda</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={3}>
          <Paper p="xl" className="stat-card">
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">{stats.soldVehicles}</Badge>
            </Group>
            <Text size="sm" color="dimmed">Satılan</Text>
          </Paper>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={4}>
          <Paper p="xl" className="stat-card">
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">{stats.totalEmployees}</Badge>
            </Group>
            <Text size="sm" color="dimmed">Toplam Personel</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={4}>
          <Paper p="xl" className="stat-card">
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">{stats.totalExpenses.toLocaleString('tr-TR')} ₺</Badge>
            </Group>
            <Text size="sm" color="dimmed">Toplam Gider</Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={4}>
          <Paper p="xl" className="stat-card">
            <Group position="apart" mb="xs">
              <IconCar size={24} color="#4c6ef5" />
              <Badge size="lg">{stats.totalSales.toLocaleString('tr-TR')} ₺</Badge>
            </Group>
            <Text size="sm" color="dimmed">Toplam Kar</Text>
          </Paper>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={6}>
          <Paper p="xl">
            <Group position="apart" mb="lg">
              <Text weight={500}>Son Satışlar</Text>
              <Badge variant="dot">Son 5 Satış</Badge>
            </Group>
            {stats.recentSales.map(sale => (
              <Group key={sale.id} position="apart" mb="md">
                <Stack spacing={4}>
                  <Text weight={500}>{sale.brand} {sale.model}</Text>
                  <Group spacing={6}>
                    <IconCalendar size={14} />
                    <Text size="sm" color="dimmed">
                      {dayjs(sale.sale_date).format('DD.MM.YYYY')}
                    </Text>
                  </Group>
                </Stack>
                <Badge 
                  color="green" 
                  size="lg"
                  variant="light"
                >
                  {(sale.sale_price - sale.purchase_price).toLocaleString('tr-TR')} ₺
                </Badge>
              </Group>
            ))}
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper p="xl">
            <Group position="apart" mb="lg">
              <Text weight={500}>Yaklaşan Maaş Ödemeleri</Text>
              <Badge variant="dot">Son 5 Maaş</Badge>
            </Group>
            {stats.upcomingSalaries.map(employee => (
              <Group key={employee.id} position="apart" mb="md">
                <Stack spacing={4}>
                  <Text weight={500}>{employee.first_name} {employee.last_name}</Text>
                  <Group spacing={6}>
                    <IconCalendar size={14} />
                    <Text size="sm" color="dimmed">
                      {employee.nextPayment}
                    </Text>
                  </Group>
                </Stack>
                <Badge 
                  color="blue" 
                  size="lg"
                  variant="light"
                >
                  {employee.totalCost.toLocaleString('tr-TR')} ₺
                </Badge>
              </Group>
            ))}
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  )
} 