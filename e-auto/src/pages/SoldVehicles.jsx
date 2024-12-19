import { useState, useEffect } from 'react'
import { Stack, Text, Group, Badge, Grid, Paper, Table, ScrollArea } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconTrendingUp, IconCash, IconPercentage } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'

const vehicleTypeLabels = {
  car: 'Otomobil',
  suv: 'SUV',
  van: 'Van',
  truck: 'Kamyonet',
}

const fuelTypeLabels = {
  gasoline: 'Benzin',
  diesel: 'Dizel',
  lpg: 'LPG',
  electric: 'Elektrik',
  hybrid: 'Hibrit',
}

const paymentMethodLabels = {
  cash: 'Nakit',
  bank_transfer: 'Havale/EFT',
  credit_card: 'Kredi Kartı',
  installment: 'Taksit',
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(price)
}

export default function SoldVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProfit: 0,
    averageProfit: 0,
    profitMargin: 0,
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const calculateStats = (data) => {
    const totalProfit = data.reduce((sum, vehicle) => 
      sum + (vehicle.sale_price - vehicle.purchase_price), 0
    )
    const averageProfit = data.length > 0 ? totalProfit / data.length : 0
    const totalRevenue = data.reduce((sum, vehicle) => sum + vehicle.sale_price, 0)
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    setStats({
      totalProfit,
      averageProfit,
      profitMargin,
    })
  }

  const fetchVehicles = async () => {
    try {
      const { data: allSoldVehicles, error: statsError } = await supabase
        .from('vehicles')
        .select('sale_price, purchase_price')
        .eq('status', 'sold')

      if (statsError) throw statsError
      calculateStats(allSoldVehicles)

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'sold')
        .order('sale_date', { ascending: false })

      if (error) throw error

      setVehicles(data)
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Araçlar yüklenirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const rows = vehicles.map((vehicle) => (
    <Table.Tr key={vehicle.id}>
      <Table.Td ta="center">{vehicle.plate}</Table.Td>
      <Table.Td ta="center">{vehicle.brand} {vehicle.model}</Table.Td>
      <Table.Td ta="center">{vehicleTypeLabels[vehicle.type]}</Table.Td>
      <Table.Td ta="center">{fuelTypeLabels[vehicle.fuel_type]}</Table.Td>
      <Table.Td ta="center">{vehicle.year}</Table.Td>
      <Table.Td ta="center">{dayjs(vehicle.sale_date).format('DD.MM.YYYY')}</Table.Td>
      <Table.Td ta="right">{formatPrice(vehicle.sale_price)}</Table.Td>
      <Table.Td ta="center">{vehicle.buyer_name}</Table.Td>
      <Table.Td ta="center">{paymentMethodLabels[vehicle.payment_method]}</Table.Td>
    </Table.Tr>
  ))

  return (
    <Stack spacing="lg">
      <Text size="xl" weight={500}>Satılan Araçlar</Text>

      <Grid>
        <Grid.Col xs={12} sm={4}>
          <Paper withBorder radius="md" p="md">
            <Group position="apart">
              <Stack spacing={0}>
                <Text color="dimmed" transform="uppercase" weight={700} size="xs">
                  Toplam Kar
                </Text>
                <Text weight={700} size="xl">
                  {formatPrice(stats.totalProfit)}
                </Text>
              </Stack>
              <IconTrendingUp size={32} stroke={1.5} />
            </Group>
          </Paper>
        </Grid.Col>

        <Grid.Col xs={12} sm={4}>
          <Paper withBorder radius="md" p="md">
            <Group position="apart">
              <Stack spacing={0}>
                <Text color="dimmed" transform="uppercase" weight={700} size="xs">
                  Ortalama Kar
                </Text>
                <Text weight={700} size="xl">
                  {formatPrice(stats.averageProfit)}
                </Text>
              </Stack>
              <IconCash size={32} stroke={1.5} />
            </Group>
          </Paper>
        </Grid.Col>

        <Grid.Col xs={12} sm={4}>
          <Paper withBorder radius="md" p="md">
            <Group position="apart">
              <Stack spacing={0}>
                <Text color="dimmed" transform="uppercase" weight={700} size="xs">
                  Kar Marjı
                </Text>
                <Text weight={700} size="xl">
                  %{stats.profitMargin.toFixed(1)}
                </Text>
              </Stack>
              <IconPercentage size={32} stroke={1.5} />
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      <ScrollArea>
        <Table 
          striped 
          highlightOnHover 
          withTableBorder 
          withColumnBorders
          horizontalSpacing="sm"
          verticalSpacing="sm"
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th ta="center">Plaka</Table.Th>
              <Table.Th ta="center">Marka Model</Table.Th>
              <Table.Th ta="center">Tip</Table.Th>
              <Table.Th ta="center">Yakıt</Table.Th>
              <Table.Th ta="center">Yıl</Table.Th>
              <Table.Th ta="center">Satış Tarihi</Table.Th>
              <Table.Th ta="center">Satış Fiyatı</Table.Th>
              <Table.Th ta="center">Alıcı</Table.Th>
              <Table.Th ta="center">Ödeme</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows}
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Stack>
  )
} 