import React from 'react'
import { useState, useEffect } from 'react'
import {
  Paper,
  Text,
  Group,
  Stack,
  Tabs,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  ThemeIcon,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { 
  IconTool, 
  IconSettings,
  IconReceipt, 
  IconShieldCheck,
  IconPlus,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'

const EXPENSE_TYPES = {
  maintenance: {
    label: 'Periyodik Bakım',
    color: 'blue',
    icon: IconTool,
  },
  repair: {
    label: 'Tamir',
    color: 'red',
    icon: IconSettings,
  },
  insurance: {
    label: 'Sigorta',
    color: 'green',
    icon: IconShieldCheck,
  },
  other: {
    label: 'Diğer',
    color: 'gray',
    icon: IconReceipt,
  },
}

export default function VehicleMaintenance() {
  const [vehicles, setVehicles] = useState([])
  const [expenses, setExpenses] = useState([])
  const [opened, setOpened] = useState(false)
  const [activeTab, setActiveTab] = useState('maintenance')
  const [editingExpense, setEditingExpense] = useState(null)

  const form = useForm({
    initialValues: {
      vehicle_id: '',
      expense_type: activeTab,
      amount: 0,
      description: '',
      expense_date: new Date(),
      next_service_date: null,
      next_service_km: null,
      service_details: '',
      warranty_end_date: null,
    },
    validate: {
      vehicle_id: (value) => {
        if (!value || value.trim() === '') {
          return 'Araç seçimi zorunludur'
        }
        return null
      },
      amount: (value) => {
        if (!value || value <= 0) {
          return 'Geçerli bir tutar giriniz'
        }
        return null
      },
      description: (value) => {
        if (!value || value.trim() === '') {
          return 'Açıklama giriniz'
        }
        return null
      },
      expense_date: (value) => {
        if (!value) {
          return 'Tarih seçiniz'
        }
        return null
      },
    },
  })

  useEffect(() => {
    fetchExpenses()
  }, [])

  useEffect(() => {
    form.setFieldValue('expense_type', activeTab)
  }, [activeTab])

  useEffect(() => {
    if (opened) {
      const getVehicles = async () => {
        try {
          let query = supabase
            .from('vehicles')
            .select('id, brand, model, plate')
            .order('brand')

          if (!editingExpense) {
            query = query.eq('status', 'available')
          }

          const { data, error } = await query

          if (error) throw error
          setVehicles(data)
        } catch (error) {
          notifications.show({
            title: 'Hata',
            message: 'Araçlar yüklenirken bir hata oluştu',
            color: 'red',
          })
        }
      }

      getVehicles()
    }
  }, [opened, editingExpense])

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_expenses')
        .select(`
          id,
          expense_type,
          amount,
          description,
          expense_date,
          next_service_date,
          next_service_km,
          service_details,
          warranty_end_date,
          vehicle:vehicles (
            id,
            brand,
            model,
            plate
          )
        `)
        .not('vehicle_id', 'is', null)
        .order('expense_date', { ascending: false })

      if (error) throw error
      setExpenses(data)
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Giderler yüklenirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (!values.vehicle_id) {
        throw new Error('Lütfen bir araç seçin')
      }

      const formData = {
        vehicle_id: values.vehicle_id,
        expense_type: activeTab,
        amount: values.amount,
        description: values.description,
        expense_date: dayjs(values.expense_date).format('YYYY-MM-DD'),
        next_service_date: values.next_service_date ? 
          dayjs(values.next_service_date).format('YYYY-MM-DD') : null,
        next_service_km: values.next_service_km || null,
        service_details: values.service_details || null,
        warranty_end_date: values.warranty_end_date ? 
          dayjs(values.warranty_end_date).format('YYYY-MM-DD') : null,
      }

      console.log('Gönderilen veriler:', formData)

      if (editingExpense) {
        const { error } = await supabase
          .from('vehicle_expenses')
          .update(formData)
          .eq('id', editingExpense.id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Kayıt güncellendi',
          color: 'green',
        })
      } else {
        const { error } = await supabase
          .from('vehicle_expenses')
          .insert([formData])

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Yeni kayıt eklendi',
          color: 'green',
        })
      }

      setOpened(false)
      form.reset()
      setEditingExpense(null)
      fetchExpenses()
    } catch (error) {
      console.error('Form gönderme hatası:', error)
      notifications.show({
        title: 'Hata',
        message: error.message || 'Kayıt işlemi sırasında bir hata oluştu',
        color: 'red',
      })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('vehicle_expenses')
        .delete()
        .eq('id', id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Kayıt silindi',
        color: 'green',
      })

      fetchExpenses()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const filteredExpenses = expenses.filter(expense => expense.expense_type === activeTab)

  return (
    <Stack spacing="lg">
      <Group position="apart">
        <Group spacing="xs">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconTool size={20} />
          </ThemeIcon>
          <Text size="xl" weight={600}>Bakım ve Giderler</Text>
        </Group>
        <Button
          leftSection={<IconPlus size={20} />}
          onClick={() => {
            form.reset()
            setEditingExpense(null)
            setOpened(true)
          }}
        >
          Yeni Kayıt
        </Button>
      </Group>

      <Paper p="md" radius="md" withBorder>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            {Object.entries(EXPENSE_TYPES).map(([key, { label, icon: Icon }]) => (
              <Tabs.Tab
                key={key}
                value={key}
                leftSection={<Icon size={16} />}
              >
                {label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {Object.keys(EXPENSE_TYPES).map((type) => (
            <Tabs.Panel key={type} value={type} pt="md">
              <Paper withBorder>
                <Table highlightOnHover>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center' }}>Tarih</th>
                      <th style={{ textAlign: 'center' }}>Araç</th>
                      <th style={{ textAlign: 'center' }}>Plaka</th>
                      <th style={{ textAlign: 'center' }}>Kategori</th>
                      <th style={{ textAlign: 'center' }}>Açıklama</th>
                      <th style={{ textAlign: 'center' }}>Tutar</th>
                      <th style={{ textAlign: 'center' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody style={{ textAlign: 'center' }}>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>{dayjs(expense.expense_date).format('DD.MM.YYYY')}</td>
                        <td>
                          <Text size="sm">
                            {expense.vehicle.brand} {expense.vehicle.model}
                          </Text>
                        </td>
                        <td>
                          <Badge variant="dot" color="gray">
                            {expense.vehicle.plate}
                          </Badge>
                        </td>
                        <td>
                          <Badge 
                            color={EXPENSE_TYPES[expense.expense_type].color}
                            variant="light"
                          >
                            {EXPENSE_TYPES[expense.expense_type].label}
                          </Badge>
                        </td>
                        <td>{expense.description}</td>
                        <td>
                          <Text weight={500} color="red">
                            {expense.amount.toLocaleString('tr-TR')} ₺
                          </Text>
                        </td>
                        <td>
                          <Group spacing={4} position="center">
                            <ActionIcon onClick={() => {
                              setEditingExpense(expense)
                              form.setValues({
                                ...expense,
                                expense_date: new Date(expense.expense_date),
                                next_service_date: expense.next_service_date ? 
                                  new Date(expense.next_service_date) : null,
                                warranty_end_date: expense.warranty_end_date ? 
                                  new Date(expense.warranty_end_date) : null,
                              })
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
            </Tabs.Panel>
          ))}
        </Tabs>
      </Paper>

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false)
          form.reset()
          setEditingExpense(null)
        }}
        title={
          <Group spacing="xs">
            <ThemeIcon color="blue" variant="light">
              {EXPENSE_TYPES[activeTab].icon && React.createElement(EXPENSE_TYPES[activeTab].icon, { size: 16 })}
            </ThemeIcon>
            <Text>
              {editingExpense ? 'Kaydı Düzenle' : 'Yeni Kayıt'}
            </Text>
          </Group>
        }
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              required
              label="Araç"
              placeholder="Araç seçiniz"
              nothingFound="Araç bulunamadı"
              searchable
              clearable={false}
              description={!editingExpense ? "Sadece satışta olan araçlar listelenir" : undefined}
              data={vehicles.map(vehicle => ({
                value: vehicle.id,
                label: `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`
              }))}
              {...form.getInputProps('vehicle_id')}
            />

            <Group grow>
              <NumberInput
                required
                label="Tutar"
                min={0}
                {...form.getInputProps('amount')}
              />
              <DateInput
                required
                label="Tarih"
                valueFormat="DD.MM.YYYY"
                {...form.getInputProps('expense_date')}
              />
            </Group>

            <TextInput
              required
              label="Açıklama"
              {...form.getInputProps('description')}
            />

            {activeTab === 'maintenance' && (
              <>
                <Group grow>
                  <DateInput
                    label="Sonraki Bakım Tarihi"
                    valueFormat="DD.MM.YYYY"
                    minDate={new Date()}
                    clearable
                    {...form.getInputProps('next_service_date')}
                  />
                  <NumberInput
                    label="Sonraki Bakım KM"
                    min={0}
                    {...form.getInputProps('next_service_km')}
                  />
                </Group>
                <TextInput
                  label="Bakım Detayları"
                  {...form.getInputProps('service_details')}
                />
              </>
            )}

            {activeTab === 'repair' && (
              <DateInput
                label="Garanti Bitiş Tarihi"
                valueFormat="DD.MM.YYYY"
                minDate={new Date()}
                clearable
                {...form.getInputProps('warranty_end_date')}
              />
            )}

            <Button type="submit">
              {editingExpense ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
} 