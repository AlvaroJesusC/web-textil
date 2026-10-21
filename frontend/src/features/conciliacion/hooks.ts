import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ajustarStockConteoApi,
  calcularDiferenciasApi,
  cerrarConteoApi,
  guardarItemsConteoApi,
  iniciarConteoApi,
  listarConteosApi,
  obtenerConteoApi,
} from './api'
import type { ItemConteoInput } from '@/types'

export function useConteos(estado?: string) {
  return useQuery({
    queryKey: ['conteos', estado],
    queryFn: () => listarConteosApi(estado),
  })
}

export function useConteo(id: number | null) {
  return useQuery({
    queryKey: ['conteo', id],
    queryFn: () => (id ? obtenerConteoApi(id) : null),
    enabled: Boolean(id),
  })
}

export function useIniciarConteo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (observaciones?: string) => iniciarConteoApi(observaciones),
    onSuccess: (nuevoConteo) => {
      queryClient.invalidateQueries({ queryKey: ['conteos'] })
      queryClient.setQueryData(['conteo', nuevoConteo.id], nuevoConteo)
    },
  })
}

export function useGuardarItemsConteo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, items }: { id: number; items: ItemConteoInput[] }) =>
      guardarItemsConteoApi(id, items),
    onSuccess: (conteoActualizado) => {
      queryClient.setQueryData(['conteo', conteoActualizado.id], conteoActualizado)
      queryClient.invalidateQueries({ queryKey: ['conteos'] })
    },
  })
}

export function useCalcularDiferencias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => calcularDiferenciasApi(id),
    onSuccess: (conteoActualizado) => {
      queryClient.setQueryData(['conteo', conteoActualizado.id], conteoActualizado)
      queryClient.invalidateQueries({ queryKey: ['conteos'] })
    },
  })
}

export function useCerrarConteo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cerrarConteoApi(id),
    onSuccess: (conteoActualizado) => {
      queryClient.setQueryData(['conteo', conteoActualizado.id], conteoActualizado)
      queryClient.invalidateQueries({ queryKey: ['conteos'] })
    },
  })
}

export function useAjustarStockConteo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      motivo,
      producto_ids,
    }: {
      id: number
      motivo: string
      producto_ids?: number[]
    }) => ajustarStockConteoApi(id, motivo, producto_ids),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conteo', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['conteos'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}
