import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TextInput,
  PasswordInput,
  Paper,
  Title,
  Container,
  Button,
  Text,
  Anchor,
  Stack,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      
      navigate('/')
    } catch (error) {
      notifications.show({
        title: 'Giriş hatası',
        message: error.message,
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} my={40}>
      <Title align="center">Hoş Geldiniz!</Title>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleLogin}>
          <Stack>
            <TextInput
              required
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <PasswordInput
              required
              label="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" loading={loading}>
              Giriş Yap
            </Button>
          </Stack>
        </form>

        <Text color="dimmed" size="sm" align="center" mt={15}>
          Hesabınız yok mu?{' '}
          <Anchor size="sm" component="a" href="/signup">
            Kayıt Ol
          </Anchor>
        </Text>
      </Paper>
    </Container>
  )
} 