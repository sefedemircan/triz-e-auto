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
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconEdit, IconTrash, IconArrowLeft, IconTool } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'

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

      // Bakım kaydını güncelle
      const { error: maintenanceError } = await supabase
        .from('vehicle_maintenance')
        .update({ 
          status: 'completed',
          end_date: new Date().toISOString(),
        })
        .eq('id', maintenance.id)

      if (maintenanceError) throw maintenanceError

      // Bakım masrafını ekle
      const { error: expenseError } = await supabase
        .from('vehicle_expenses')
        .insert([{
          vehicle_id: id,
          expense_type: 'maintenance',
          amount: maintenance.estimated_cost,
          description: maintenance.description,
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
        {vehicle?.status === 'available' && (
          <Button
            leftSection={<IconTool size={20} />}
            variant="gradient"
            gradient={{ from: 'orange', to: 'red' }}
            onClick={() => setMaintenanceModalOpened(true)}
          >
            Bakıma Al
          </Button>
        )}
      </Group>

      <Grid>
        <Grid.Col span={6}>
          <Paper p="md" radius="md">
            <Text weight={500} size="lg" mb="md">Araç Bilgileri</Text>
            {/* ... mevcut içerik */}
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper p="md" radius="md">
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
            {/* ... mevcut tablo */}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* ... mevcut modallar */}
    </Stack>
  )
} 