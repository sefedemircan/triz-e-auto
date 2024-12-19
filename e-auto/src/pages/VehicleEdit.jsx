import { useState, useEffect } from 'react'
import {
  TextInput,
  NumberInput,
  Select,
  Button,
  Paper,
  Stack,
  Group,
  Text,
  FileInput,
  Image,
  SimpleGrid,
  ActionIcon,
  LoadingOverlay,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconTrash, IconUpload } from '@tabler/icons-react'
import { v4 as uuidv4 } from 'uuid'

const vehicleTypes = [
  { value: 'car', label: 'Otomobil' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Kamyonet' },
]

const fuelTypes = [
  { value: 'gasoline', label: 'Benzin' },
  { value: 'diesel', label: 'Dizel' },
  { value: 'lpg', label: 'LPG' },
  { value: 'electric', label: 'Elektrik' },
  { value: 'hybrid', label: 'Hibrit' },
]

const statusTypes = [
  { value: 'available', label: 'Satışta' },
  { value: 'sold', label: 'Satıldı' },
  { value: 'reserved', label: 'Rezerve' },
]

export default function VehicleEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState([])
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    type: '',
    fuel_type: '',
    plate: '',
    chassis_number: '',
    purchase_price: 0,
    purchase_date: '',
    description: '',
    status: '',
  })

  useEffect(() => {
    fetchVehicle()
  }, [id])

  const fetchVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setFormData(data)
      if (data.photos) {
        setPhotos(data.photos)
        setUploadedPhotos(data.photos.map(url => ({
          path: url.split('/').pop(),
          url
        })))
      }
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Araç bilgileri yüklenirken bir hata oluştu',
        color: 'red',
      })
      navigate('/vehicles')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (files) => {
    if (!files || files.length === 0) return

    const newPhotos = [...photos]
    const newUploadedPhotos = [...uploadedPhotos]

    for (const file of files) {
      const photoId = uuidv4()
      const fileExt = file.name.split('.').pop()
      const fileName = `${photoId}.${fileExt}`
      const filePath = `${fileName}`

      try {
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle-photos')
          .getPublicUrl(filePath)

        newPhotos.push(URL.createObjectURL(file))
        newUploadedPhotos.push({ path: filePath, url: publicUrl })
      } catch (error) {
        console.error('Upload error:', error)
        notifications.show({
          title: 'Hata',
          message: 'Fotoğraf yüklenirken bir hata oluştu',
          color: 'red',
        })
      }
    }

    setPhotos(newPhotos)
    setUploadedPhotos(newUploadedPhotos)
  }

  const handlePhotoRemove = async (index) => {
    try {
      const { error } = await supabase.storage
        .from('vehicle-photos')
        .remove([uploadedPhotos[index].path])

      if (error) throw error

      const newPhotos = photos.filter((_, i) => i !== index)
      const newUploadedPhotos = uploadedPhotos.filter((_, i) => i !== index)

      setPhotos(newPhotos)
      setUploadedPhotos(newUploadedPhotos)
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Fotoğraf silinirken bir hata oluştu',
        color: 'red',
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const photoUrls = uploadedPhotos.map(photo => photo.url)

      const { error } = await supabase
        .from('vehicles')
        .update({
          ...formData,
          photos: photoUrls,
        })
        .eq('id', id)

      if (error) throw error

      notifications.show({
        title: 'Başarılı',
        message: 'Araç başarıyla güncellendi',
        color: 'green',
      })

      navigate('/vehicles')
    } catch (error) {
      notifications.show({
        title: 'Hata',
        message: 'Araç güncellenirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper p="md" radius="md" withBorder pos="relative">
      <LoadingOverlay visible={loading} />
      
      <form onSubmit={handleSubmit}>
        <Stack spacing="md">
          <Text size="xl" weight={500}>Araç Düzenle</Text>

          <SimpleGrid cols={2}>
            <TextInput
              required
              label="Marka"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />

            <TextInput
              required
              label="Model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
          </SimpleGrid>

          <SimpleGrid cols={3}>
            <NumberInput
              required
              label="Yıl"
              value={formData.year}
              onChange={(value) => setFormData({ ...formData, year: value })}
              min={1900}
              max={new Date().getFullYear()}
            />

            <Select
              required
              label="Araç Tipi"
              data={vehicleTypes}
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value })}
            />

            <Select
              required
              label="Yakıt Tipi"
              data={fuelTypes}
              value={formData.fuel_type}
              onChange={(value) => setFormData({ ...formData, fuel_type: value })}
            />
          </SimpleGrid>

          <SimpleGrid cols={3}>
            <TextInput
              required
              label="Plaka"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
            />

            <TextInput
              required
              label="Şasi Numarası"
              value={formData.chassis_number}
              onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
            />

            <Select
              required
              label="Durum"
              data={statusTypes}
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <NumberInput
              required
              label="Alış Fiyatı"
              value={formData.purchase_price}
              onChange={(value) => setFormData({ ...formData, purchase_price: value })}
              min={0}
              precision={2}
              thousandSeparator=","
            />

            <TextInput
              required
              type="date"
              label="Alış Tarihi"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            />
          </SimpleGrid>

          <TextInput
            label="Açıklama"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Stack spacing="xs">
            <FileInput
              label="Fotoğraflar"
              placeholder="Fotoğraf seçin"
              accept="image/*"
              multiple
              icon={<IconUpload size={14} />}
              onChange={handlePhotoUpload}
            />

            {photos.length > 0 && (
              <SimpleGrid cols={4} spacing="xs">
                {photos.map((photo, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <Image
                      src={photo}
                      radius="md"
                      alt={`Araç fotoğrafı ${index + 1}`}
                      style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                    />
                    <ActionIcon
                      color="red"
                      variant="filled"
                      size="sm"
                      style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                      }}
                      onClick={() => handlePhotoRemove(index)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </div>
                ))}
              </SimpleGrid>
            )}
          </Stack>

          <Group position="right" mt="md">
            <Button
              variant="subtle"
              onClick={() => navigate('/vehicles')}
            >
              İptal
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              Kaydet
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  )
} 