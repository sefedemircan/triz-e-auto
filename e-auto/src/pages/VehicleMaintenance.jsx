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
  Combobox,
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
import { confirmModal } from '../utils/confirmModal'

const EXPENSE_TYPES = {
  maintenance: { 
    label: 'Bakım', 
    color: 'blue',
    icon: IconTool 
  },
  repair: { 
    label: 'Onarım', 
    color: 'red',
    icon: IconSettings 
  },
  insurance: { 
    label: 'Sigorta', 
    color: 'green',
    icon: IconShieldCheck 
  },
  tax: { 
    label: 'Vergi', 
    color: 'yellow',
    icon: IconReceipt 
  },
  fuel: { 
    label: 'Yakıt', 
    color: 'orange',
    icon: IconReceipt 
  },
  other: { 
    label: 'Diğer', 
    color: 'gray',
    icon: IconReceipt 
  },
}

export default function VehicleMaintenance() {
  const [vehicles, setVehicles] = useState([])
  const [vehicleOptions, setVehicleOptions] = useState([])
  const [expenses, setExpenses] = useState([])
  const [modalOpened, setModalOpened] = useState(false)
  const [activeTab, setActiveTab] = useState('maintenance')
  const [editingExpense, setEditingExpense] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    expense_type: activeTab,
    amount: 0,
    description: '',
    expense_date: new Date(),
    next_service_date: null,
    next_service_km: null,
    service_details: '',
    warranty_end_date: null,
  })

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
    if (modalOpened) {
      fetchVehicles()
    }
  }, [modalOpened])

  const expenseTypes = [
    { value: 'maintenance', label: 'Bakım' },
    { value: 'repair', label: 'Tamir' },
    { value: 'insurance', label: 'Sigorta' },
    { value: 'tax', label: 'Vergi' },
    { value: 'fuel', label: 'Yakıt' },
    { value: 'other', label: 'Diğer' },
  ];

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
          vehicle:vehicle_id(
            id,
            plate,
            brand:brand_id(name),
            model:model_id(name)
          )
        `)
        .not('expense_type', 'eq', 'salary')
        .not('expense_type', 'eq', 'insurance_payment')
        .not('expense_type', 'eq', 'bonus')
        .not('expense_type', 'eq', 'food_allowance')
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      notifications.show({
        title: 'Hata',
        message: 'Giderler yüklenirken bir hata oluştu',
        color: 'red',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!selectedVehicle) {
        throw new Error('Lütfen bir araç seçin')
      }

      const { data, error } = await supabase
        .from('vehicle_expenses')
        .insert({
          vehicle_id: selectedVehicle,
          expense_type: activeTab,
          amount: parseFloat(formData.amount),
          description: formData.description.trim(),
          expense_date: dayjs(formData.expense_date).format('YYYY-MM-DD'),
          next_service_date: formData.next_service_date ? 
            dayjs(formData.next_service_date).format('YYYY-MM-DD') : null,
          next_service_km: formData.next_service_km || null,
          service_details: formData.service_details || null,
          warranty_end_date: formData.warranty_end_date ? 
            dayjs(formData.warranty_end_date).format('YYYY-MM-DD') : null
        })
        .select()

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Gider kaydedildi',
        color: 'green',
      })

      setSelectedVehicle(null)
      setFormData({
        expense_type: activeTab,
        amount: 0,
        description: '',
        expense_date: new Date(),
        next_service_date: null,
        next_service_km: null,
        service_details: '',
        warranty_end_date: null,
      })
      setModalOpened(false)

      fetchExpenses()
    } catch (error) {
      console.error('Submit error:', error)
      notifications.show({
        title: 'Hata',
        message: error.message || 'Gider kaydedilirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await confirmModal({
        title: 'Kayıt Silme Onayı',
        message: 'Bu bakım/gider kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
        confirmLabel: 'Evet, Sil',
        onConfirm: async () => {
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
        }
      })
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const filteredExpenses = expenses.filter(expense => expense.expense_type === activeTab)

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          plate,
          brand:brand_id(name),
          model:model_id(name),
          status
        `)
        .in('status', ['available', 'for_sale'])
        .order('created_at', { ascending: false })

      if (error) throw error

      let finalVehicles = [...(data || [])]

      if (editingExpense?.vehicle) {
        const existingVehicle = finalVehicles.find(v => v.id === editingExpense.vehicle.id)
        if (!existingVehicle) {
          finalVehicles.push({
            id: editingExpense.vehicle.id,
            plate: editingExpense.vehicle.plate,
            brand: editingExpense.vehicle.brand,
            model: editingExpense.vehicle.model
          })
        }
      }

      setVehicles(finalVehicles)

      const options = finalVehicles.map(vehicle => ({
        value: vehicle.id,
        label: `${vehicle.brand?.name} ${vehicle.model?.name} - ${vehicle.plate}`
      }))
      setVehicleOptions(options)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      notifications.show({
        title: 'Hata',
        message: 'Araçlar yüklenirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      expense_type: activeTab,
      amount: 0,
      description: '',
      expense_date: new Date(),
      next_service_date: null,
      next_service_km: null,
      service_details: '',
      warranty_end_date: null,
    })
    setSelectedVehicle('')
  }

  const handleOpenModal = async () => {
    setModalOpened(true)
    await fetchVehicles()
  }

  const handleCloseModal = () => {
    setModalOpened(false)
    setEditingExpense(null)
    form.reset()
    resetForm()
  }

  const handleEdit = (expense) => {
    setEditingExpense(expense)
    form.setValues({
      ...expense,
      expense_date: new Date(expense.expense_date),
      next_service_date: expense.next_service_date ? 
        new Date(expense.next_service_date) : null,
      warranty_end_date: expense.warranty_end_date ? 
        new Date(expense.warranty_end_date) : null,
    })
    setSelectedVehicle(expense.vehicle.id)
    handleOpenModal()
  }

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
          onClick={handleOpenModal}
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
                leftSection={Icon && <Icon size={16} />}
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
                            {expense.vehicle?.brand?.name} {expense.vehicle?.model?.name}
                          </Text>
                        </td>
                        <td>
                          <Badge variant="dot" color="gray">
                            {expense.vehicle?.plate}
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
                            <ActionIcon onClick={() => handleEdit(expense)}>
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
        opened={modalOpened}
        onClose={handleCloseModal}
        title={
          <Group spacing="xs">
            <ThemeIcon color="blue" variant="light">
              {EXPENSE_TYPES[activeTab].icon && 
                React.createElement(EXPENSE_TYPES[activeTab].icon, { size: 16 })}
            </ThemeIcon>
            <Text>
              {editingExpense ? 'Kaydı Düzenle' : 'Yeni Kayıt'}
            </Text>
          </Group>
        }
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          <Stack>
            <Select
              required
              label="Araç"
              placeholder="Araç seçin"
              value={selectedVehicle}
              onChange={setSelectedVehicle}
              data={vehicleOptions}
              searchable
              nothingFoundMessage="Araç bulunamadı"
              onDropdownOpen={fetchVehicles}
            />

            <Group grow>
              <NumberInput
                required
                label="Tutar"
                value={formData.amount}
                onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                min={0}
                precision={2}
              />
              <DateInput
                required
                label="Tarih"
                value={formData.expense_date}
                onChange={(value) => setFormData(prev => ({ ...prev, expense_date: value }))}
                maxDate={new Date()}
              />
            </Group>

            <TextInput
              required
              label="Açıklama"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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