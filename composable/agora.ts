// composable/agora.ts
import type { IAgoraRTC } from 'agora-rtc-sdk-ng/esm';
import { ref, markRaw } from 'vue';

export function useAgora(appId: string, channel: string, uid: string, token?: string) {
  const client = ref<any>(null)
  const localVideoTrack = ref<any>(null)
  const localAudioTrack = ref<any>(null)
  const remoteStream = ref<any>(null)

  const { $agora } = useNuxtApp()

  const agora = computed(() => {
    return $agora as IAgoraRTC
  })
  
  /**
   * Join channel dengan atau tanpa publish video/audio
   * @param cameraId - Camera device ID (optional)
   * @param viewOnly - Jika true, hanya subscribe (tidak publish) - untuk participant
   */
  const joinChannel = async (cameraId?: string, viewOnly: boolean = false) => {
    try {
      client.value = markRaw(agora.value.createClient({ mode: 'rtc', codec: 'vp8' }))
      
      // Join channel dengan token (jika ada) atau null (testing mode)
      const user = await client.value.join(appId, channel, token || null, uid)
      console.log('✅ Joined channel successfully. User:', user)

      // Jika view-only mode, skip create & publish tracks
      if (viewOnly) {
        console.log('📺 View-only mode: Not publishing video/audio')
        return { client, localVideoTrack, localAudioTrack }
      }

      // Create video & audio tracks (untuk host atau participant yang mau publish)
      const [audioTrack, videoTrack] = await Promise.all([
        agora.value.createMicrophoneAudioTrack(),
        agora.value.createCameraVideoTrack({
          cameraId: cameraId
        }),
      ])

      localAudioTrack.value = audioTrack
      localVideoTrack.value = videoTrack

      // Publish tracks
      await client.value.publish([localVideoTrack.value, localAudioTrack.value])
      console.log('✅ Published tracks successfully')
      
      return { client, localVideoTrack, videoTrack, localAudioTrack }
    } catch (err) {
      console.error('❌ Error joining channel:', err)
      throw err
    }
  }

  const leaveChannel = async () => {
    try {
      if (client.value) {
        // Unpublish tracks jika ada
        if (localVideoTrack.value && localAudioTrack.value) {
          await client.value.unpublish([localVideoTrack.value, localAudioTrack.value])
        }
        await client.value.leave()
        console.log('✅ Left channel successfully')
      }
    } catch(err) {
      console.error('Failed to leave channel:', err)
    }
  }

  /**
   * Switch camera - unpublish old track, create new track, publish new track
   * @param cameraId - New camera device ID
   * @returns New video track
   */
  const switchCamera = async (cameraId: string) => {
    if (localVideoTrack.value) {
      console.log('🔄 Switching camera to:', cameraId)
      
      // Unpublish old video track
      await client.value.unpublish([localVideoTrack.value])
      
      // Stop and close old track to free resources
      localVideoTrack.value.stop()
      localVideoTrack.value.close()

      // Create new video track with new camera
      const videoTrack = await agora.value.createCameraVideoTrack({
        cameraId: cameraId,
        encoderConfig: {
          width: 1920,
          height: 1080,
          frameRate: 30,
          bitrateMax: 1500,
          bitrateMin: 800
        }
      })

      localVideoTrack.value = videoTrack

      // Publish new video track
      await client.value.publish([localVideoTrack.value])
      console.log('✅ Camera switched successfully')
      
      return { videoTrack }
    }
  }

  const toggleScreenShare = async () => {
    await client.value.unpublish([localAudioTrack.value, localVideoTrack.value])
    await localVideoTrack.value.stop()
    localVideoTrack.value = null

    const screenTrack = await agora.value.createScreenVideoTrack({})
    localVideoTrack.value = screenTrack

    await client.value.publish(localVideoTrack.value)
    return { localVideoTrack }
  }

  return { client, localVideoTrack, localAudioTrack, remoteStream, joinChannel, toggleScreenShare, leaveChannel, switchCamera }
}