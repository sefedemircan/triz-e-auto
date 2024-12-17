import { useState, useEffect } from 'react'
import {
  Table,
  Group,
  Button,
  Text,
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Stack,
  Paper,
  ThemeIcon,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconTrash, IconPlus, IconEye, IconCash, IconCar } from '@tabler/icons-react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

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

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [opened, setOpened] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [saleModalOpened, setSaleModalOpened] = useState(false)
  const [sellingVehicle, setSellingVehicle] = useState(null)
  const navigate = useNavigate()

  const form = useForm({
    initialValues: {
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      plate: '',
      purchase_date: null,
      purchase_price: 0,
      status: 'available',
    },
    validate: {
      brand: (value) => !value && 'Marka zorunludur',
      model: (value) => !value && 'Model zorunludur',
      plate: (value) => !value && 'Plaka zorunludur',
      purchase_price: (value) => value <= 0 && 'Geçerli bir alış fiyatı girin',
    },
  })

  const saleForm = useForm({
    initialValues: {
      sale_date: null,
      sale_price: 0,
    },
    validate: {
      sale_price: (value) => value <= 0 && 'Geçerli bir satış fiyatı girin',
    },
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false })

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

  const handleSubmit = async (values) => {
    try {
      const formData = {
        ...values,
        purchase_date: values.purchase_date ? dayjs(values.purchase_date).format('YYYY-MM-DD') : null,
      }

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(formData)
          .eq('id', editingVehicle.id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Araç güncellendi',
          color: 'green',
        })
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert([formData])

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Araç eklendi',
          color: 'green',
        })
      }

      setOpened(false)
      form.reset()
      setEditingVehicle(null)
      fetchVehicles()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle)
    form.setValues(vehicle)
    setOpened(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Bu aracı silmek istediğinizden emin misiniz?')) {
      try {
        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', id)

        if (error) throw error

        notifications.show({
          title: 'Başarılı',
          message: 'Araç silindi',
          color: 'green',
        })

        fetchVehicles()
      } catch (error) {
        notifications.show({
          title: 'Hata',
          message: error.message,
          color: 'red',
        })
      }
    }
  }

  const handleSale = async (values) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          status: 'sold',
          sale_date: values.sale_date ? dayjs(values.sale_date).format('YYYY-MM-DD') : null,
          sale_price: values.sale_price,
        })
        .eq('id', sellingVehicle.id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Araç satış işlemi tamamlandı',
        color: 'green',
      })

      setSaleModalOpened(false)
      saleForm.reset()
      setSellingVehicle(null)
      fetchVehicles()
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: error.message,
        color: 'red',
      })
    }
  }

  return (
    <Stack spacing="lg">
      <Group position="apart">
        <Group spacing="xs">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'teal', to: 'lime' }}>
            <IconCar size={20} />
          </ThemeIcon>
          <Text size="xl" weight={600}>Araçlar</Text>
        </Group>
        <Button
          leftSection={<IconPlus size={20} />}
          variant="gradient"
          gradient={{ from: 'teal', to: 'lime' }}
          onClick={() => {
            form.reset()
            setEditingVehicle(null)
            setOpened(true)
          }}
        >
          Yeni Araç Ekle
        </Button>
      </Group>

      <Paper p="md" radius="md">
        <Table highlightOnHover>
          <thead>
            <tr>
              <th>Marka</th>
              <th>Model</th>
              <th>Yıl</th>
              <th>Plaka</th>
              <th>Alış Tarihi</th>
              <th>Alış Fiyatı</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>{vehicle.brand}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.year}</td>
                <td>{vehicle.plate}</td>
                <td>{new Date(vehicle.purchase_date).toLocaleDateString('tr-TR')}</td>
                <td>{vehicle.purchase_price.toLocaleString('tr-TR')} ₺</td>
                <td>
                  <Badge color={statusColors[vehicle.status]}>
                    {statusLabels[vehicle.status]}
                  </Badge>
                </td>
                <td>
                  <Group spacing={4}>
                    <ActionIcon onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
                      <IconEye size={18} />
                    </ActionIcon>
                    {vehicle.status === 'available' && (
                      <ActionIcon 
                        color="green"
                        onClick={() => {
                          setSellingVehicle(vehicle)
                          setSaleModalOpened(true)
                        }}
                      >
                        <IconCash size={18} />
                      </ActionIcon>
                    )}
                    <ActionIcon onClick={() => handleEdit(vehicle)}>
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon color="red" onClick={() => handleDelete(vehicle.id)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Paper>

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false)
          form.reset()
          setEditingVehicle(null)
        }}
        title={
          <Group spacing="xs">
            <ThemeIcon color="teal" variant="light">
              <IconCar size={16} />
            </ThemeIcon>
            <Text>{editingVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle'}</Text>
          </Group>
        }
        size="md"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              required
              label="Marka"
              placeholder="Mercedes"
              {...form.getInputProps('brand')}
            />
            <TextInput
              required
              label="Model"
              placeholder="C200"
              {...form.getInputProps('model')}
            />
            <NumberInput
              required
              label="Yıl"
              placeholder="2024"
              min={1900}
              max={new Date().getFullYear()}
              {...form.getInputProps('year')}
            />
            <TextInput
              required
              label="Plaka"
              placeholder="34ABC123"
              {...form.getInputProps('plate')}
            />
            <DateInput
              required
              label="Alış Tarihi"
              placeholder="Tarih seçin"
              valueFormat="DD.MM.YYYY"
              clearable
              {...form.getInputProps('purchase_date')}
            />
            <NumberInput
              required
              label="Alış Fiyatı"
              placeholder="750000"
              min={0}
              {...form.getInputProps('purchase_price')}
            />
            <Select
              required
              label="Durum"
              data={[
                { value: 'available', label: 'Satışta' },
                { value: 'sold', label: 'Satıldı' },
                { value: 'in_maintenance', label: 'Bakımda' },
              ]}
              {...form.getInputProps('status')}
            />
            <Button type="submit">Kaydet</Button>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={saleModalOpened}
        onClose={() => {
          setSaleModalOpened(false)
          saleForm.reset()
          setSellingVehicle(null)
        }}
        title={
          <Group spacing="xs">
            <ThemeIcon color="green" variant="light">
              <IconCash size={16} />
            </ThemeIcon>
            <Text>Araç Satış</Text>
          </Group>
        }
        size="md"
      >
        <form onSubmit={saleForm.onSubmit(handleSale)}>
          <Stack>
            <DateInput
              required
              label="Satış Tarihi"
              placeholder="Tarih seçin"
              valueFormat="DD.MM.YYYY"
              clearable
              {...saleForm.getInputProps('sale_date')}
            />
            <NumberInput
              required
              label="Satış Fiyatı"
              placeholder="850000"
              min={0}
              {...saleForm.getInputProps('sale_price')}
            />
            <Group position="apart">
              <Text size="sm">Alış Fiyatı:</Text>
              <Text size="sm" weight={500}>
                {sellingVehicle?.purchase_price.toLocaleString('tr-TR')} ₺
              </Text>
            </Group>
            <Group position="apart">
              <Text size="sm">Tahmini Kar:</Text>
              <Text 
                size="sm" 
                weight={500}
                color={saleForm.values.sale_price > (sellingVehicle?.purchase_price || 0) ? 'green' : 'red'}
              >
                {(saleForm.values.sale_price - (sellingVehicle?.purchase_price || 0)).toLocaleString('tr-TR')} ₺
              </Text>
            </Group>
            <Button type="submit">Satışı Tamamla</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
} 