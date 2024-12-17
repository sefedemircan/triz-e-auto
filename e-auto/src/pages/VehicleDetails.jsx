import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Paper,
  Text,
  Group,
  Stack,
  Button,
  ActionIcon,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Table,
  Badge,
  Grid,
  Divider,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconArrowLeft, IconTool } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'
import classes from '../styles/Paper.module.css'

const statusColors = {
  available: 'green',
  sold: 'blue',
  in_maintenance: 'orange',
}

const statusLabels = {
  available: 'Satışta',
  sold: 'Satıldı',
  in_maintenance: 'Bakımda',
}

const expenseTypeLabels = {
  maintenance: 'Bakım',
  repair: 'Onarım',
  insurance: 'Sigorta',
  tax: 'Vergi',
  other: 'Diğer',
}

export default function VehicleDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [opened, setOpened] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [loading, setLoading] = useState(true)
  const [maintenanceModalOpened, setMaintenanceModalOpened] = useState(false)
  const [maintenanceHistory, setMaintenanceHistory] = useState([])
  const [currentMaintenance, setCurrentMaintenance] = useState(null)

  const form = useForm({
    initialValues: {
      expense_type: '',
      amount: 0,
      description: '',
      expense_date: null,
    },
    validate: {
      expense_type: (value) => !value && 'Masraf türü seçiniz',
      amount: (value) => value <= 0 && 'Geçerli bir tutar giriniz',
      expense_date: (value) => !value && 'Tarih seçiniz',
    },
  })

  const maintenanceForm = useForm({
    initialValues: {
      start_date: null,
      estimated_end_date: null,
      description: '',
      estimated_cost: 0,
    },
    validate: {
      description: (value) => !value && 'Açıklama zorunludur',
      estimated_cost: (value) => value < 0 && 'Geçerli bir tutar girin',
    },
  })

  useEffect(() => {
    fetchVehicleDetails()
  }, [id])

  const fetchVehicleDetails = async () => {
    try {
      // Araç bilgilerini al
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()

      if (vehicleError) throw vehicleError
      setVehicle(vehicleData)

      // Araç masraflarını al
      const { data: expensesData, error: expensesError } = await supabase
        .from('vehicle_expenses')
        .select('*')
        .eq('vehicle_id', id)
        .order('expense_date', { ascending: false })

      if (expensesError) throw expensesError
      setExpenses(expensesData)

      // Bakım geçmişini al
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('vehicle_maintenance')
        .select('*')
        .eq('vehicle_id', id)
        .order('start_date', { ascending: false })

      if (maintenanceError) throw maintenanceError
      setMaintenanceHistory(maintenanceData)

      // Devam eden bakımı al
      if (vehicleData.status === 'in_maintenance') {
        const { data: maintenance, error: maintenanceError } = await supabase
          .from('vehicle_maintenance')
          .select('*')
          .eq('vehicle_id', id)
          .eq('status', 'ongoing')
          .single()

        if (maintenanceError) throw maintenanceError
        setCurrentMaintenance(maintenance)
      } else {
        setCurrentMaintenance(null)
      }
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Araç detayları yüklenirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      const expenseData = {
        ...values,
        vehicle_id: id,
        expense_date: values.expense_date ? dayjs(values.expense_date).format('YYYY-MM-DD') : null,
      }

      if (editingExpense) {
        const { error } = await supabase
          .from('vehicle_expenses')
          .update(expenseData)
          .eq('id', editingExpense.id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Masraf güncellendi',
          color: 'green',
        })
      } else {
        const { error } = await supabase
          .from('vehicle_expenses')
          .insert([expenseData])

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Masraf eklendi',
          color: 'green',
        })
      }

      setOpened(false)
      form.reset()
      setEditingExpense(null)
      fetchVehicleDetails()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const handleDelete = async (expenseId) => {
    if (window.confirm('Bu masrafı silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await supabase
          .from('vehicle_expenses')
          .delete()
          .eq('id', expenseId)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Masraf silindi',
          color: 'green',
        })

        fetchVehicleDetails()
      } catch (error) {
        notifications.show({
          title: 'Hata',
          message: error.message,
          color: 'red',
        })
      }
    }
  }

  const handleMaintenance = async (values) => {
    try {
      const maintenanceData = {
        vehicle_id: id,
        ...values,
        start_date: values.start_date ? new Date(values.start_date).toISOString().split('T')[0] : null,
        estimated_end_date: values.estimated_end_date ? new Date(values.estimated_end_date).toISOString().split('T')[0] : null,
        status: 'ongoing',
      }

      const { error: maintenanceError } = await supabase
        .from('vehicle_maintenance')
        .insert([maintenanceData])

      if (maintenanceError) throw maintenanceError

      // Araç durumunu güncelle
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'in_maintenance' })
        .eq('id', id)

      if (vehicleError) throw vehicleError

      notifications.show({
        title: 'Başarılı',
        message: 'Araç bakıma alındı',
        color: 'green',
      })

      setMaintenanceModalOpened(false)
      maintenanceForm.reset()
      fetchVehicleDetails()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const handleMaintenanceComplete = async () => {
    try {
      // Devam eden bakımı bul
      const { data: maintenance, error: fetchError } = await supabase
        .from('vehicle_maintenance')
        .select('*')
        .eq('vehicle_id', id)
        .eq('status', 'ongoing')
        .single()

      if (fetchError) throw fetchError

      // Bakım kaydını güncelle - sadece status ve end_date
      const { error: maintenanceError } = await supabase
        .from('vehicle_maintenance')
        .update({ 
          status: 'completed',
          end_date: new Date().toISOString(),
        })
        .eq('id', maintenance.id)

      if (maintenanceError) throw maintenanceError

      // Bakım masrafını ekle - estimated_cost kullan
      const { error: expenseError } = await supabase
        .from('vehicle_expenses')
        .insert([{
          vehicle_id: id,
          expense_type: 'maintenance',
          amount: maintenance.estimated_cost,
          description: `Bakım: ${maintenance.description}`,
          expense_date: new Date().toISOString(),
        }])

      if (expenseError) throw expenseError

      // Araç durumunu güncelle
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'available' })
        .eq('id', id)

      if (vehicleError) throw vehicleError

      notifications.show({
        title: 'Başarılı',
        message: 'Bakım tamamlandı ve masraf olarak eklendi',
        color: 'green',
      })

      fetchVehicleDetails()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  if (!vehicle) return null

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalCost = (vehicle?.purchase_price || 0) + totalExpenses
  const profit = vehicle?.status === 'sold' 
    ? (vehicle.sale_price - totalCost)
    : null

  return (
    <Stack spacing="lg">
      <Group position="apart">
        <Group spacing="xs">
          <ActionIcon 
            variant="light" 
            color="gray" 
            onClick={() => navigate('/vehicles')}
          >
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Text size="xl" weight={600}>{vehicle?.brand} {vehicle?.model}</Text>
          <Badge 
            color={statusColors[vehicle?.status]} 
            variant="light"
            size="lg"
          >
            {statusLabels[vehicle?.status]}
          </Badge>
        </Group>
        {vehicle?.status === 'available' ? (
          <Button
            leftSection={<IconTool size={20} />}
            variant="gradient"
            gradient={{ from: 'orange', to: 'red' }}
            onClick={() => setMaintenanceModalOpened(true)}
          >
            Bakıma Al
          </Button>
        ) : vehicle?.status === 'in_maintenance' ? (
          <Button
            leftSection={<IconTool size={20} />}
            variant="gradient"
            gradient={{ from: 'teal', to: 'lime' }}
            onClick={() => {
              if (window.confirm('Bakımı tamamlamak istediğinize emin misiniz?')) {
                handleMaintenanceComplete()
              }
            }}
          >
            Bakımı Tamamla
          </Button>
        ) : null}
      </Group>

      <Grid>
        <Grid.Col span={6}>
          <Paper p="md" radius="md" withBorder className={classes.paper}>
            <Text weight={500} size="lg" mb="md">Araç Bilgileri</Text>
            <Stack spacing="xs">
              <Group position="apart">
                <Text color="dimmed">Marka/Model:</Text>
                <Text>{vehicle?.brand} {vehicle?.model}</Text>
              </Group>
              <Group position="apart">
                <Text color="dimmed">Yıl:</Text>
                <Text>{vehicle?.year}</Text>
              </Group>
              <Group position="apart">
                <Text color="dimmed">Plaka:</Text>
                <Text>{vehicle?.plate}</Text>
              </Group>
              <Group position="apart">
                <Text color="dimmed">Alış Tarihi:</Text>
                <Text>{vehicle?.purchase_date ? new Date(vehicle.purchase_date).toLocaleDateString('tr-TR') : '-'}</Text>
              </Group>
              <Group position="apart">
                <Text color="dimmed">Alış Fiyatı:</Text>
                <Text>{vehicle?.purchase_price?.toLocaleString('tr-TR')} ₺</Text>
              </Group>
              <Divider my="xs" />
              <Group position="apart">
                <Text color="dimmed">Toplam Masraf:</Text>
                <Text color="red">{totalExpenses.toLocaleString('tr-TR')} ₺</Text>
              </Group>
              <Group position="apart">
                <Text color="dimmed">Toplam Maliyet:</Text>
                <Text weight={500}>{totalCost.toLocaleString('tr-TR')} ₺</Text>
              </Group>
              {vehicle?.status === 'sold' && (
                <>
                  <Group position="apart">
                    <Text color="dimmed">Satış Fiyatı:</Text>
                    <Text>{vehicle.sale_price.toLocaleString('tr-TR')} ₺</Text>
                  </Group>
                  <Group position="apart">
                    <Text color="dimmed">Kar/Zarar:</Text>
                    <Text weight={500} color={profit >= 0 ? 'green' : 'red'}>
                      {profit.toLocaleString('tr-TR')} ₺
                    </Text>
                  </Group>
                </>
              )}
            </Stack>
          </Paper>

          <Paper p="md" radius="md" mt="md" withBorder className={classes.paper}>
            <Text weight={500} size="lg" mb="md">Masraf Özeti</Text>
            <Stack spacing="xs">
              {Object.entries(expenseTypeLabels).map(([type, label]) => {
                const typeTotal = expenses
                  .filter(e => e.expense_type === type)
                  .reduce((sum, e) => sum + e.amount, 0)
                
                if (typeTotal === 0) return null

                return (
                  <Group key={type} position="apart">
                    <Text color="dimmed">{label}:</Text>
                    <Text>{typeTotal.toLocaleString('tr-TR')} ₺</Text>
                  </Group>
                )
              })}
            </Stack>
          </Paper>
        </Grid.Col>

        <Grid.Col span={6}>
          <Paper p="md" radius="md" withBorder className={classes.paper}>
            <Group position="apart" mb="md">
              <Text weight={500} size="lg">Masraflar</Text>
              <Button
                leftSection={<IconPlus size={20} />}
                variant="light"
                onClick={() => {
                  form.reset()
                  setEditingExpense(null)
                  setOpened(true)
                }}
              >
                Masraf Ekle
              </Button>
            </Group>

            <Table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Tür</th>
                  <th>Açıklama</th>
                  <th>Tutar</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{new Date(expense.expense_date).toLocaleDateString('tr-TR')}</td>
                    <td>
                      <Badge>{expenseTypeLabels[expense.expense_type]}</Badge>
                    </td>
                    <td>{expense.description}</td>
                    <td>{expense.amount.toLocaleString('tr-TR')} ₺</td>
                    <td>
                      <Group spacing={4}>
                        <ActionIcon onClick={() => {
                          setEditingExpense(expense)
                          form.setValues(expense)
                          setOpened(true)
                        }}>
                          <IconEdit size={18} />
                        </ActionIcon>
                        <ActionIcon color="red" onClick={() => handleDelete(expense.id)}>
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Paper>
        </Grid.Col>

        <Grid.Col span={12}>
          <Paper p="md" radius="md" withBorder className={classes.paper}>
            <Text weight={500} size="lg" mb="md">Bakım Geçmişi</Text>
            <Table>
              <thead>
                <tr>
                  <th>Başlangıç</th>
                  <th>Bitiş</th>
                  <th>Açıklama</th>
                  <th>Maliyet</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceHistory.map((maintenance) => (
                  <tr key={maintenance.id}>
                    <td>{new Date(maintenance.start_date).toLocaleDateString('tr-TR')}</td>
                    <td>
                      {maintenance.end_date 
                        ? new Date(maintenance.end_date).toLocaleDateString('tr-TR')
                        : maintenance.estimated_end_date 
                          ? new Date(maintenance.estimated_end_date).toLocaleDateString('tr-TR') + ' (Tahmini)'
                          : '-'
                      }
                    </td>
                    <td>{maintenance.description}</td>
                    <td>{maintenance.estimated_cost.toLocaleString('tr-TR')} ₺</td>
                    <td>
                      <Badge 
                        color={maintenance.status === 'completed' ? 'green' : 'orange'}
                      >
                        {maintenance.status === 'completed' ? 'Tamamlandı' : 'Devam Ediyor'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Masraf Ekleme/Düzenleme Modal */}
      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false)
          form.reset()
          setEditingExpense(null)
        }}
        title={editingExpense ? 'Masraf Düzenle' : 'Yeni Masraf Ekle'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              required
              label="Masraf Türü"
              data={Object.entries(expenseTypeLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              {...form.getInputProps('expense_type')}
            />

            <NumberInput
              required
              label="Tutar"
              min={0}
              {...form.getInputProps('amount')}
            />

            <TextInput
              label="Açıklama"
              {...form.getInputProps('description')}
            />

            <DateInput
              required
              label="Tarih"
              valueFormat="DD.MM.YYYY"
              {...form.getInputProps('expense_date')}
            />

            <Button type="submit">Kaydet</Button>
          </Stack>
        </form>
      </Modal>

      {/* Bakım Modal */}
      <Modal
        opened={maintenanceModalOpened}
        onClose={() => {
          setMaintenanceModalOpened(false)
          maintenanceForm.reset()
        }}
        title="Bakıma Al"
      >
        <form onSubmit={maintenanceForm.onSubmit(handleMaintenance)}>
          <Stack>
            <DateInput
              required
              label="Başlangıç Tarihi"
              valueFormat="DD.MM.YYYY"
              {...maintenanceForm.getInputProps('start_date')}
            />

            <DateInput
              required
              label="Tahmini Bitiş Tarihi"
              valueFormat="DD.MM.YYYY"
              {...maintenanceForm.getInputProps('estimated_end_date')}
            />

            <TextInput
              required
              label="Açıklama"
              {...maintenanceForm.getInputProps('description')}
            />

            <NumberInput
              required
              label="Tahmini Maliyet"
              min={0}
              {...maintenanceForm.getInputProps('estimated_cost')}
            />

            <Button type="submit">Bakıma Al</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
} 