import { useState, useEffect } from 'react'
import {
  Table,
  Text,
  Group,
  Paper,
  Stack,
  Badge,
  Grid,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconTrendingUp, IconCash, IconPercentage } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'

export default function SoldVehicles() {
  const [soldVehicles, setSoldVehicles] = useState([])
  const [stats, setStats] = useState({
    totalProfit: 0,
    averageProfit: 0,
    profitMargin: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSoldVehicles()
  }, [])

  const fetchSoldVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'sold')
        .order('sale_date', { ascending: false })

      if (error) throw error

      setSoldVehicles(data)

      // İstatistikleri hesapla
      const totalProfit = data.reduce((sum, vehicle) => sum + (vehicle.sale_price - vehicle.purchase_price), 0)
      const averageProfit = totalProfit / data.length
      const totalRevenue = data.reduce((sum, vehicle) => sum + vehicle.sale_price, 0)
      const profitMargin = (totalProfit / totalRevenue) * 100

      setStats({
        totalProfit,
        averageProfit,
        profitMargin,
      })
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Satılan araçlar yüklenirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return null

  return (
    <Stack>
      <Text size="xl" weight={500} mb="md">Satılan Araçlar</Text>

      <Grid mb="md">
        <Grid.Col xs={12} sm={4}>
          <Paper withBorder radius="md" p="md">
            <Group position="apart">
              <Stack spacing={0}>
                <Text color="dimmed" transform="uppercase" weight={700} size="xs">
                  Toplam Kar
                </Text>
                <Text weight={700} size="xl">
                  {stats.totalProfit.toLocaleString('tr-TR')} ₺
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
                  {stats.averageProfit.toLocaleString('tr-TR')} ₺
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

      <Paper withBorder radius="md" p="md">
        <Table>
          <thead>
            <tr>
              <th>Araç</th>
              <th>Plaka</th>
              <th>Alış Tarihi</th>
              <th>Satış Tarihi</th>
              <th>Alış Fiyatı</th>
              <th>Satış Fiyatı</th>
              <th>Kar</th>
              <th>Kar Marjı</th>
            </tr>
          </thead>
          <tbody>
            {soldVehicles.map((vehicle) => {
              const profit = vehicle.sale_price - vehicle.purchase_price
              const margin = (profit / vehicle.sale_price) * 100
              
              return (
                <tr key={vehicle.id}>
                  <td>{vehicle.brand} {vehicle.model} ({vehicle.year})</td>
                  <td>{vehicle.plate}</td>
                  <td>{new Date(vehicle.purchase_date).toLocaleDateString('tr-TR')}</td>
                  <td>{new Date(vehicle.sale_date).toLocaleDateString('tr-TR')}</td>
                  <td>{vehicle.purchase_price.toLocaleString('tr-TR')} ₺</td>
                  <td>{vehicle.sale_price.toLocaleString('tr-TR')} ₺</td>
                  <td>
                    <Text color={profit >= 0 ? 'green' : 'red'} weight={500}>
                      {profit.toLocaleString('tr-TR')} ₺
                    </Text>
                  </td>
                  <td>
                    <Badge color={margin >= 0 ? 'green' : 'red'}>
                      %{margin.toFixed(1)}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Paper>
    </Stack>
  )
} 