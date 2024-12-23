import { useState, useEffect } from 'react'
import {
  Group,
  Button,
  Paper,
  Text,
  Badge,
  ActionIcon,
  SimpleGrid,
  Card,
  Image,
  Stack,
  Tooltip,
  Modal,
  NumberInput,
  Textarea,
  Select,
  TextInput,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconPlus, IconEdit, IconTrash, IconCar, IconCurrencyLira, IconEye } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { DateInput } from '@mantine/dates'
import { confirmModal } from '../utils/confirmModal'

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

const statusLabels = {
  available: { label: 'Satışta', color: 'blue' },
  sold: { label: 'Satıldı', color: 'green' },
  reserved: { label: 'Rezerve', color: 'yellow' },
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(price)
}

export default function VehicleList() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [sellModalOpen, setSellModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [saleForm, setSaleForm] = useState({
    price: 0,
    date: new Date(),
    payment_method: 'cash',
    buyer_name: '',
    buyer_phone: '',
    notes: '',
  })

  const paymentMethods = [
    { value: 'cash', label: 'Nakit' },
    { value: 'bank_transfer', label: 'Havale/EFT' },
    { value: 'credit_card', label: 'Kredi Kartı' },
    { value: 'installment', label: 'Taksit' },
  ]

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          brand:brand_id(id, name),
          model:model_id(id, name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setVehicles(data || [])
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      notifications.show({
        title: 'Hata',
        message: 'Araçlar yüklenirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await confirmModal({
        title: 'Araç Silme Onayı',
        message: 'Bu aracı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
        confirmLabel: 'Evet, Sil',
        onConfirm: async () => {
          const vehicle = vehicles.find(v => v.id === id)
          
          // Önce fotoğrafları sil
          if (vehicle.photos && vehicle.photos.length > 0) {
            const photoPaths = vehicle.photos.map(url => url.split('/').pop())

            const { error: storageError } = await supabase.storage
              .from('vehicle-photos')
              .remove(photoPaths)

            if (storageError) throw storageError
          }

          // Sonra araç kaydını sil
          const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id)

          if (error) throw error

          notifications.show({
            title: 'Başarılı',
            message: 'Araç başarıyla silindi',
            color: 'green',
          })

          setVehicles(vehicles.filter(vehicle => vehicle.id !== id))
        }
      })
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Araç silinirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const handleSellClick = (vehicle) => {
    setSelectedVehicle({
      ...vehicle,
      brand: vehicle.brand?.name,
      model: vehicle.model?.name
    })
    setSaleForm({
      price: 0,
      date: new Date(),
      payment_method: 'cash',
      buyer_name: '',
      buyer_phone: '',
      notes: '',
    })
    setSellModalOpen(true)
  }

  const handleSell = async () => {
    try {
      if (!selectedVehicle) return
      if (!saleForm.price || saleForm.price <= 0) {
        throw new Error('Geçerli bir satış fiyatı girin')
      }
      if (!saleForm.buyer_name) {
        throw new Error('Alıcı adını girin')
      }

      const { error } = await supabase
        .from('vehicles')
        .update({ 
          status: 'sold',
          sale_date: dayjs(saleForm.date).format('YYYY-MM-DD'),
          sale_price: saleForm.price,
          buyer_name: saleForm.buyer_name,
          buyer_phone: saleForm.buyer_phone,
          payment_method: saleForm.payment_method,
          sale_notes: saleForm.notes
        })
        .eq('id', selectedVehicle.id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Araç satışı kaydedildi',
        color: 'green',
      })

      // Satılan aracı listeden kaldır
      setVehicles(vehicles.filter(v => v.id !== selectedVehicle.id))

      setSellModalOpen(false)
    } catch (error) {
      console.error('Sell error:', error)
      notifications.show({
        title: 'Hata',
        message: error.message || 'Araç satışı kaydedilirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  return (
    <Stack spacing="lg">
      <Group position="apart">
        <Text size="xl" weight={500}>Satıştaki Araçlar</Text>
        <Button
          leftSection={<IconPlus size={14} />}
          onClick={() => navigate('/vehicles/new')}
        >
          Yeni Araç
        </Button>
      </Group>

      <SimpleGrid
        cols={3}
        spacing="lg"
        breakpoints={[
          { maxWidth: 'md', cols: 2 },
          { maxWidth: 'sm', cols: 1 },
        ]}
      >
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} shadow="sm" padding="lg" radius="md" withBorder>
            {vehicle.photos && vehicle.photos.length > 0 ? (
              <Card.Section>
                <Image
                  src={vehicle.photos?.[0]}
                  height={200}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  fallbackSrc="https://placehold.co/600x400?text=Fotoğraf+Yok"
                  onError={(e) => {
                    console.error('Fotoğraf yükleme hatası:', e)
                    console.log('Hatalı URL:', vehicle.photos?.[0])
                    // Hata durumunda fallback image'i göster
                    e.target.src = "https://placehold.co/600x400?text=Fotoğraf+Yok"
                  }}
                  styles={{
                    image: {
                      objectFit: 'cover',
                    }
                  }}
                />
              </Card.Section>
            ) : (
              <Card.Section>
                <Group position="center" style={{ height: 200, backgroundColor: '#f8f9fa' }}>
                  <IconCar size={48} color="#adb5bd" />
                </Group>
              </Card.Section>
            )}

            <Stack spacing="xs" mt="md">
              <Group position="apart">
                <Group spacing="xs">
                  <Text size="lg" weight={500}>
                    {vehicle.brand?.name} {vehicle.series || vehicle.model?.name}
                  </Text>
                  <Badge color={statusLabels[vehicle.status].color}>
                    {statusLabels[vehicle.status].label}
                  </Badge>
                </Group>
                <Text weight={700} color="blue" size="lg">
                  {vehicle.purchase_price?.toLocaleString('tr-TR')} ₺
                </Text>
              </Group>

              <Group spacing="xs">
                <Badge variant="light">{vehicle.year}</Badge>
                <Badge variant="light">{vehicleTypeLabels[vehicle.type]}</Badge>
                <Badge variant="light">{fuelTypeLabels[vehicle.fuel_type]}</Badge>
              </Group>

              <Group position="apart">
                <Text size="sm" color="dimmed">
                  {vehicle.plate}
                </Text>
                <Group spacing={4}>
                  {vehicle.status === 'available' && (
                    <Tooltip label="Sat">
                      <ActionIcon
                        color="green"
                        onClick={() => handleSellClick(vehicle)}
                      >
                        <IconCurrencyLira size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  <Tooltip label="Düzenle">
                    <ActionIcon
                      color="blue"
                      onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Sil">
                    <ActionIcon
                      color="red"
                      onClick={() => handleDelete(vehicle.id)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* Satış Modalı */}
      <Modal
        opened={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        title={
          <Stack spacing={4}>
            <Text size="lg" weight={500}>
              Araç Satış Detayları
            </Text>
            {selectedVehicle && (
              <Text size="sm" color="dimmed">
                {selectedVehicle.brand?.name} {selectedVehicle.series || selectedVehicle.model?.name} - {selectedVehicle.plate}
              </Text>
            )}
          </Stack>
        }
        size="md"
      >
        <Stack spacing="md">
          <Group grow>
            <NumberInput
              required
              label="Satış Fiyatı"
              value={saleForm.price}
              onChange={(value) => setSaleForm({ ...saleForm, price: value })}
              min={0}
              step={1000}
              prefix="₺"
              precision={2}
              defaultValue={0}
            />
            <DateInput
              required
              label="Satış Tarihi"
              value={saleForm.date}
              onChange={(value) => setSaleForm({ ...saleForm, date: value })}
              maxDate={new Date()}
            />
          </Group>

          <Select
            required
            label="Ödeme Yöntemi"
            data={paymentMethods}
            value={saleForm.payment_method}
            onChange={(value) => setSaleForm({ ...saleForm, payment_method: value })}
          />

          <TextInput
            required
            label="Alıcı Adı"
            value={saleForm.buyer_name}
            onChange={(e) => setSaleForm({ ...saleForm, buyer_name: e.target.value })}
            placeholder="Ad Soyad"
          />

          <TextInput
            label="Alıcı Telefon"
            value={saleForm.buyer_phone}
            onChange={(e) => setSaleForm({ ...saleForm, buyer_phone: e.target.value })}
            placeholder="0555 555 55 55"
          />

          <Textarea
            label="Notlar"
            value={saleForm.notes}
            onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
            placeholder="Satış ile ilgili notlar..."
            minRows={3}
          />

          <Group position="right" mt="md">
            <Button variant="light" onClick={() => setSellModalOpen(false)}>
              İptal
            </Button>
            <Button color="green" onClick={handleSell}>
              Satışı Tamamla
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
} 