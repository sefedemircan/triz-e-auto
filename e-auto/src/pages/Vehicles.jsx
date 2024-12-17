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
      purchase_date: new Date(),
      purchase_price: 0,
    },
    validate: {
      brand: (value) => !value && 'Marka giriniz',
      model: (value) => !value && 'Model giriniz',
      plate: (value) => !value && 'Plaka giriniz',
      purchase_price: (value) => value <= 0 && 'Geçerli bir fiyat giriniz',
    },
  })

  const saleForm = useForm({
    initialValues: {
      sale_date: new Date(),
      sale_price: 0,
    },
    validate: {
      sale_price: (value) => value <= 0 && 'Geçerli bir fiyat giriniz',
    },
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    if (editingVehicle) {
      form.setValues({
        ...editingVehicle,
        purchase_date: new Date(editingVehicle.purchase_date),
      })
    }
  }, [editingVehicle])

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
      const formattedValues = {
        ...values,
        purchase_date: dayjs(values.purchase_date).format('YYYY-MM-DD'),
      }

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(formattedValues)
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
          .insert([{ ...formattedValues, status: 'available' }])

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
    form.setValues({
      ...vehicle,
      purchase_date: vehicle.purchase_date ? new Date(vehicle.purchase_date) : null,
    })
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
          sale_date: dayjs(values.sale_date).format('YYYY-MM-DD'),
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

      <Paper 
        p="md" 
        radius="md" 
        withBorder 
        className={classes.paper}
      >
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
              placeholder="2023"
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
              value={form.values.purchase_date ? new Date(form.values.purchase_date) : null}
              onChange={(date) => form.setFieldValue('purchase_date', date)}
            />

            <NumberInput
              required
              label="Alış Fiyatı"
              placeholder="500000"
              min={0}
              {...form.getInputProps('purchase_price')}
            />

            <Button type="submit">
              {editingVehicle ? 'Güncelle' : 'Ekle'}
            </Button>
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
        title="Araç Satış"
      >
        <form onSubmit={saleForm.onSubmit(handleSale)}>
          <Stack>
            <DateInput
              required
              label="Satış Tarihi"
              placeholder="Tarih seçin"
              valueFormat="DD.MM.YYYY"
              clearable
              value={saleForm.values.sale_date ? new Date(saleForm.values.sale_date) : null}
              onChange={(date) => saleForm.setFieldValue('sale_date', date)}
            />

            <NumberInput
              required
              label="Satış Fiyatı"
              placeholder="600000"
              min={0}
              {...saleForm.getInputProps('sale_price')}
            />

            <Button type="submit">Satışı Tamamla</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  )
} 