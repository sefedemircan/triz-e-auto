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
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconTrash, IconUpload } from '@tabler/icons-react'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import { vehicleTypes, vehicleBrands } from '../data/vehicleData'

const fuelTypes = [
  { value: 'gasoline', label: 'Benzin' },
  { value: 'diesel', label: 'Dizel' },
  { value: 'lpg', label: 'LPG' },
  { value: 'electric', label: 'Elektrik' },
  { value: 'hybrid', label: 'Hibrit' },
]

export default function VehicleForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState([])
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    type: 'car',
    year: new Date().getFullYear(),
    fuel_type: 'gasoline',
    plate: '',
    chassis_number: '',
    purchase_price: 0,
    purchase_date: dayjs().format('YYYY-MM-DD'),
    description: '',
    series: ''
  })
  const [brands, setBrands] = useState([])
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)

  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase
        .from('vehicle_brands')
        .select('*')
        .eq('type', formData.type)
        .order('name')
      
      setBrands(data || [])
    }

    if (formData.type) {
      fetchBrands()
    }
  }, [formData.type])

  useEffect(() => {
    const fetchModels = async () => {
      const { data } = await supabase
        .from('vehicle_models')
        .select('*')
        .eq('brand_id', formData.brand)
        .order('name')
      
      setModels(data || [])
    }

    if (formData.brand) {
      fetchModels()
    }
  }, [formData.brand])

  useEffect(() => {
    if (formData.model) {
      const model = models.find(m => m.id === formData.model)
      setSelectedModel(model)
      setFormData(prev => ({ ...prev, series: '' }))
    }
  }, [formData.model])

  useEffect(() => {
    console.log('Brand changed:', formData.brand)
  }, [formData.brand])

  useEffect(() => {
    console.log('Model changed:', formData.model)
  }, [formData.model])

  const handlePhotoUpload = async (files) => {
    if (!files || files.length === 0) return

    const newPhotos = [...photos]
    const newUploadedPhotos = [...uploadedPhotos]
    let hasError = false

    for (const file of files) {
      try {
        const photoId = uuidv4()
        const fileExt = file.name.split('.').pop()
        const fileName = `${photoId}.${fileExt}`
        const filePath = fileName

        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          })

        if (uploadError) throw uploadError

        const { data } = await supabase.storage
          .from('vehicle-photos')
          .getPublicUrl(filePath)

        console.log('Public URL:', data.publicUrl)

        newPhotos.push(URL.createObjectURL(file))
        newUploadedPhotos.push({ 
          path: filePath,
          url: data.publicUrl
        })
      } catch (error) {
        hasError = true
        console.error('Upload error:', error)
        notifications.show({
          title: 'Hata',
          message: `${file.name} yüklenirken bir hata oluştu`,
          color: 'red',
        })
      }
    }

    if (!hasError) {
      setPhotos(newPhotos)
      setUploadedPhotos(newUploadedPhotos)
      notifications.show({
        title: 'Başarılı',
        message: 'Fotoğraflar başarıyla yüklendi',
        color: 'green',
      })
    }
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
      console.error('Remove error:', error)
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
      console.log('Full Form Data:', formData)
      console.log('Brand ID:', formData.brand)
      console.log('Model ID:', formData.model)
      console.log('Brands List:', brands)
      console.log('Models List:', models)

      if (!formData.brand) {
        throw new Error('Lütfen marka seçin')
      }
      if (!formData.model) {
        throw new Error('Lütfen model seçin')
      }

      const photoUrls = uploadedPhotos.map(photo => photo.url)

      const vehicleData = {
        brand_id: formData.brand,
        model_id: formData.model,
        type: formData.type,
        year: parseInt(formData.year),
        fuel_type: formData.fuel_type,
        plate: formData.plate.trim().toUpperCase(),
        chassis_number: formData.chassis_number.trim().toUpperCase(),
        purchase_price: parseFloat(formData.purchase_price),
        purchase_date: dayjs(formData.purchase_date).format('YYYY-MM-DD'),
        description: formData.description?.trim() || null,
        photos: photoUrls,
        series: formData.series?.trim() || null,
        status: 'available'
      }

      console.log('Vehicle Data to Insert:', vehicleData)

      if (!vehicleData.brand_id || !vehicleData.model_id) {
        throw new Error('Marka ve model seçimi zorunludur')
      }

      const { data, error: insertError } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error('Araç kaydedilirken bir hata oluştu')
      }

      console.log('Inserted Data:', data)

      notifications.show({
        title: 'Başarılı',
        message: 'Araç başarıyla kaydedildi',
        color: 'green',
      })

      navigate('/vehicles')
    } catch (error) {
      console.error('Submit error:', error)
      notifications.show({
        title: 'Hata',
        message: error.message || 'Araç kaydedilirken bir hata oluştu',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const brandSelectData = brands.map(brand => ({
    value: brand.id,
    label: brand.name
  }))

  const modelSelectData = models.map(model => ({
    value: model.id,
    label: model.name,
    series: model.series
  }))

  const getSeriesOptions = () => {
    if (!selectedModel?.series) return []
    
    return selectedModel.series.split(',').map(series => ({
      value: series.trim(),
      label: series.trim()
    }))
  }

  return (
    <Paper p="md" radius="md" withBorder>
      <form onSubmit={handleSubmit}>
        <Stack spacing="md">
          <Text size="xl" weight={500}>Yeni Araç Kaydı</Text>

          <SimpleGrid cols={3}>
            <Select
              required
              label="Araç Tipi"
              data={vehicleTypes}
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value })}
            />

            <Select
              required
              label="Marka"
              data={brands.map(brand => ({
                value: brand.id,
                label: brand.name
              }))}
              value={formData.brand}
              onChange={(value) => {
                console.log('Selected brand:', value)
                setFormData({ 
                  ...formData, 
                  brand: value,
                  model: '',
                  series: ''
                })
              }}
              disabled={!formData.type}
            />

            <Select
              required
              label="Model"
              data={models.map(model => ({
                value: model.id,
                label: model.name,
                series: model.series
              }))}
              value={formData.model}
              onChange={(value) => {
                console.log('Selected model:', value)
                setFormData({ 
                  ...formData, 
                  model: value,
                  series: ''
                })
              }}
              disabled={!formData.brand}
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
              label="Yakıt Tipi"
              data={fuelTypes}
              value={formData.fuel_type}
              onChange={(value) => setFormData({ ...formData, fuel_type: value })}
            />

            <Select
              label="Seri"
              data={getSeriesOptions()}
              value={formData.series}
              onChange={(value) => setFormData({ ...formData, series: value })}
              disabled={!selectedModel?.series}
              placeholder={selectedModel?.series ? 'Seri seçin' : 'Model seçilmedi'}
            />
          </SimpleGrid>

          <SimpleGrid cols={2}>
            <TextInput
              required
              label="Plaka"
              value={formData.plate}
              onChange={(e) => setFormData({ 
                ...formData, 
                plate: e.target.value.toUpperCase().replace(/\s+/g, '') 
              })}
              placeholder="34ABC123"
            />

            <TextInput
              required
              label="Şasi Numarası"
              value={formData.chassis_number}
              onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value })}
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