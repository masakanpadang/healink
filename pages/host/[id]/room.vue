<template>
    <div class="flex w-full h-screen overflow-hidden">
      <div class="flex flex-col w-full h-full">
        <div class="flex w-full bg-[#3b62f0] p-4 text-white w-full items-center gap-4 flex-shrink-0">
            <div class="flex flex-col flex-1">
                <p class="text-xs">Room's ID</p>
                <p class="font-bold text-xl">{{ roomID }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
                <button v-if="!totalDurationTime" class="h-[25px] flex items-center justify-center class text-xs md:text-sm bg-orange-400 text-white rounded-lg px-2 py-1 hover:bg-orange-500 focus:outline-none" @click="switchCameraInternal">
                    Switch Camera
                </button>
                <button v-if="!totalDurationTime && availableCameras.length > 1" class="h-[25px] flex items-center justify-center class text-xs md:text-sm bg-teal-400 text-white rounded-lg px-2 py-1 hover:bg-teal-500 focus:outline-none" @click="switchCamera2Internal">
                    Switch Camera 2
                </button>
                <button v-if="!totalDurationTime && onCall" class="h-[35px] w-[35px] flex items-center justify-center text-white rounded-lg focus:outline-none text-xl" :class="isMuted ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-400 hover:bg-green-500'" @click="toggleMute" :title="isMuted ? 'Unmute' : 'Mute'">
                    {{ isMuted ? '🔇' : '🎤' }}
                </button>
                <button v-if="showEraserLine" class="h-[25px] flex items-center justify-center class text-xs md:text-sm bg-orange-400 text-white rounded-lg px-2 py-1 hover:bg-orange-500 focus:outline-none" @click="clearAnnotation">
                    Clear Annotation
                </button>
                <button v-if="onCall" class="h-[25px] flex items-center justify-center class text-xs md:text-sm bg-red-400 text-white rounded-lg px-2 py-1 hover:bg-red-500 focus:outline-none" @click="endCall">
                    End call
                </button>
            </div>
        </div>

        <div v-if="totalDurationTime" class="flex p-4 bg-gray-100 w-full justify-center">
            <p>The call has <span class="text-red-400 font-bold">ended</span>. Total duration <span class="text-red-400 font-bold">{{ totalDurationTime }}</span></p>
        </div>
        
        <div v-else class="flex flex-col w-full h-full">
            <!-- Info Banner -->
            <div v-if="availableCameras.length > 1" class="flex justify-center p-2 bg-green-50 w-full flex-shrink-0">
                <p class="text-sm text-gray-700">
                    🎥 Active Camera: <span class="font-bold">{{ selectedCam === 1 ? camera1Name : camera2Name }}</span>
                    <span class="text-xs text-gray-500 ml-2">({{ currentMirrorState ? 'Mirrored' : 'Normal' }})</span>
                    <span class="text-xs text-gray-500 ml-1">(Controlled by participant)</span>
                </p>
            </div>

            <div class="relative w-full flex justify-center items-center p-4 flex-1 overflow-hidden">
                <div class="relative w-full max-w-[min(100vw,calc((100vh-140px)*16/9))] aspect-video">
                    <!-- Main video with mirror -->
                    <video ref="cameraInput" autoplay playsinline :class="['w-full h-full object-contain rounded-xl bg-black', currentMirrorState ? 'scale-x-[-1]' : '']"></video>
                    
                    <!-- Canvas for annotations - NO MIRROR on canvas itself -->
                    <canvas 
                        ref="canvas" 
                        class="absolute top-0 left-0 w-full h-full"
                        @mousedown="startDraw" 
                        @mousemove="draw" 
                        @mouseup="stopDraw" 
                        @touchstart.prevent="startDrawTouch" 
                        @touchmove.prevent="drawTouch" 
                        @touchend="stopDraw"
                    ></canvas>
                </div>
            </div>

            <!-- Preview Camera 2 (small) -->
            <div v-if="selectedCamera2Id && availableCameras.length > 1" class="fixed bottom-4 right-4 w-48 aspect-video">
                <video ref="camera2Input" autoplay playsinline :class="['w-full h-full object-contain rounded-xl bg-black border-2 border-white shadow-lg', camera2Mirror ? 'scale-x-[-1]' : '']"></video>
            </div>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { Timestamp, collection, onSnapshot, query, orderBy, getDocs, deleteDoc, doc, addDoc, setDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { useAgora } from '~/composable/agora';
import { getCoordinates } from '~/utils/canvasUtils';

const route = useRoute()
const roomID = ref(route.params.id as string ?? '')
const config = useRuntimeConfig()
const appID = ref(config.public.APP_ID)

const userUUID = ref('e1c4fbd9e3f1459aab16e5f1ffaf5474')
const canvas = ref<HTMLCanvasElement | null>(null)
const ctxCanvas = ref<CanvasRenderingContext2D | null>(null)
const cameraInput = ref<HTMLVideoElement | null>(null)
const camera2Input = ref<HTMLVideoElement | null>(null)
const startTime = ref()
const totalDurationTime = ref<string | null>(null)
const onCall = ref(false)
const isDrawing = ref(false)
const showEraserLine = ref(false)
const lastX = ref<number | null>(null)
const lastY = ref<number | null>(null)
const availableCameras = ref<MediaDeviceInfo[]>([])
const selectedCameraId = ref<string | null>(null)
const selectedCamera2Id = ref<string | null>(null)
const lines: Ref<LineData[]> = ref([])
const isMuted = ref(false)
const camera2Stream = ref<MediaStream | null>(null)
const camera1Name = ref('Camera 1')
const camera2Name = ref('Camera 2')

const selectedCam = ref(1)
const isSwitchingCamera = ref(false)

const camera1Mirror = ref(true)
const camera2Mirror = ref(false)

const currentMirrorState = computed(() => {
    return selectedCam.value === 1 ? camera1Mirror.value : camera2Mirror.value
})

const { $firestore } = useNuxtApp()
const { client, joinChannel, localVideoTrack, localAudioTrack, leaveChannel, switchCamera } = useAgora(appID.value, roomID.value, userUUID.value)

interface LineData {
    startX: number
    startY: number
    endX: number
    endY: number
    role: number
    color: string
    timestamp: Timestamp
}

onMounted(async () => {
    await getAvailableCameras();
    if (availableCameras.value.length > 0) {
        selectedCameraId.value = availableCameras.value[0].deviceId
        camera1Name.value = availableCameras.value[0].label || 'Camera 1'
        await startCamera(selectedCameraId.value)
        
        if (availableCameras.value.length > 1) {
            selectedCamera2Id.value = availableCameras.value[1].deviceId
            camera2Name.value = availableCameras.value[1].label || 'Camera 2'
            await startCamera2(selectedCamera2Id.value)
        }
    }
    
    await initializeCameraStates()
    await initializeRoom() // NEW: Initialize room collection
    join()

    document.body.classList.add('overflow-hidden')
    listenUserPublish()
    listenToCameraStatesChanges()
    
    nextTick(() => {
        if (cameraInput.value) {
            cameraInput.value.onloadeddata = () => {
                setCanvasSize()
                listenToDrawingUpdates()
            }
        }
        window.addEventListener('resize', () => {
            setCanvasSize()
            drawLineOnCanvas()
        })
    })
})

onBeforeUnmount(() => {
    clearSession()
})

const getAvailableCameras = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        availableCameras.value = devices.filter((device) => device.kind === 'videoinput')
    } catch (error) {
        console.error('Error fetching available cameras:', error)
    }
}

const initializeCameraStates = async () => {
    try {
        const roomMetaDoc = doc(firestore.value, 'room-meta', roomID.value)
        await setDoc(roomMetaDoc, {
            selectedCam: 1,
            camera1: selectedCameraId.value,
            camera2: selectedCamera2Id.value,
            camera1Name: camera1Name.value,
            camera2Name: camera2Name.value,
            camera1Mirror: true,
            camera2Mirror: false,
            updatedAt: Timestamp.now()
        }, { merge: true })
        
        console.log('✅ Initialized camera states')
    } catch (err) {
        console.error('❌ Error initializing camera states:', err)
    }
}

// NEW: Initialize room collection so participant can join
const initializeRoom = async () => {
    try {
        const roomCollection = collection(firestore.value, roomID.value)
        const roomInitDoc = doc(roomCollection, '_init')
        
        await setDoc(roomInitDoc, {
            createdAt: Timestamp.now(),
            createdBy: 'host',
            status: 'active'
        })
        
        console.log('✅ Room collection initialized')
    } catch (err) {
        console.error('❌ Error initializing room:', err)
    }
}

const listenToCameraStatesChanges = () => {
    const roomMetaDoc = doc(firestore.value, 'room-meta', roomID.value)
    
    onSnapshot(roomMetaDoc, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data()
            const newSelectedCam = data.selectedCam || 1
            const newCamera1Mirror = data.camera1Mirror ?? true
            const newCamera2Mirror = data.camera2Mirror ?? false
            
            // Update mirror states
            camera1Mirror.value = newCamera1Mirror
            camera2Mirror.value = newCamera2Mirror
            
            // Check if camera switch is needed
            if (newSelectedCam !== selectedCam.value && !isSwitchingCamera.value) {
                console.log(`🔄 Camera switch requested: ${selectedCam.value} → ${newSelectedCam}`)
                isSwitchingCamera.value = true
                
                try {
                    if (newSelectedCam === 1) {
                        await switchToCamera1()
                    } else if (newSelectedCam === 2) {
                        await switchToCamera2()
                    }
                    selectedCam.value = newSelectedCam
                } catch (err) {
                    console.error('❌ Error switching camera:', err)
                } finally {
                    isSwitchingCamera.value = false
                }
            }
            
            // Redraw canvas after mirror state changes
            setTimeout(() => {
                drawLineOnCanvas()
            }, 100)
        }
    })
}

const switchToCamera1 = async () => {
    if (!selectedCameraId.value) return
    
    console.log('📷 Switching to Camera 1')
    await stopCamera()
    await startCamera(selectedCameraId.value)
    
    if (localVideoTrack.value) {
        await switchCamera(selectedCameraId.value)
    }
}

const switchToCamera2 = async () => {
    if (!selectedCamera2Id.value) return
    
    console.log('📷 Switching to Camera 2')
    await stopCamera()
    await startCamera(selectedCamera2Id.value)
    
    if (localVideoTrack.value) {
        await switchCamera(selectedCamera2Id.value)
    }
}

const switchCameraInternal = async () => {
    if (isSwitchingCamera.value) return
    if (availableCameras.value.length < 2) {
        console.log('⚠️ Only one camera available')
        return
    }
    
    isSwitchingCamera.value = true
    
    try {
        const newCam = selectedCam.value === 1 ? 2 : 1
        console.log(`🔄 Host manually switching to camera ${newCam}`)
        
        if (newCam === 1) {
            await switchToCamera1()
        } else {
            await switchToCamera2()
        }
        
        selectedCam.value = newCam
        await updateCameraStatesInFirestore()
    } catch (err) {
        console.error('❌ Error switching camera:', err)
    } finally {
        isSwitchingCamera.value = false
    }
}

const switchCamera2Internal = async () => {
    if (!selectedCamera2Id.value || !camera2Input.value) return
    
    try {
        const tempCameraId = selectedCameraId.value
        const tempCameraName = camera1Name.value
        const tempMirror = camera1Mirror.value
        
        selectedCameraId.value = selectedCamera2Id.value
        camera1Name.value = camera2Name.value
        camera1Mirror.value = camera2Mirror.value
        
        selectedCamera2Id.value = tempCameraId
        camera2Name.value = tempCameraName
        camera2Mirror.value = tempMirror
        
        await stopCamera()
        await stopCamera2()
        
        if (selectedCameraId.value) {
            await startCamera(selectedCameraId.value)
        }
        if (selectedCamera2Id.value) {
            await startCamera2(selectedCamera2Id.value)
        }
        
        if (selectedCam.value === 1 && localVideoTrack.value) {
            await switchCamera(selectedCameraId.value!)
        }
        
        await updateCameraStatesInFirestore()
        console.log('✅ Camera 2 positions swapped')
    } catch (err) {
        console.error('❌ Error swapping camera 2:', err)
    }
}

const toggleMute = async () => {
    if (localAudioTrack.value) {
        await localAudioTrack.value.setEnabled(isMuted.value)
        isMuted.value = !isMuted.value
    }
}

const endCall = () => {
    const duration = Date.now() - startTime.value
    totalDurationTime.value = millisToMinutesAndSeconds(duration)
    onCall.value = false
    leaveChannel()
}

const millisToMinutesAndSeconds = (millis: number) => {
    const minutes = Math.floor(millis / 60000)
    const seconds = parseInt(((millis % 60000) / 1000).toFixed(0))
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds
}

const clearSession = () => {
    stopCamera()
    stopCamera2()
    leaveChannel()
    document.body.classList.remove('overflow-hidden')
}

const clearAnnotation = async () => {
    try {
        const linesCollection = collection(firestore.value, roomID.value)
        const snapshot = await getDocs(linesCollection)
        
        snapshot.docs.forEach(async (document) => {
            if (document.id !== '_init') {
                await deleteDoc(doc(firestore.value, roomID.value, document.id))
            }
        })
        
        lines.value = []
        showEraserLine.value = false
        console.log('✅ All annotations cleared')
    } catch (err) {
        console.error('Error clearing annotations', err)
    }
}

const startCamera = async (deviceId: string) => {
    if (!cameraInput.value) return
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
            audio: false
        })
        cameraInput.value.srcObject = stream
        console.log('✅ Camera started:', deviceId)
    } catch (error) {
        console.error("Could not start camera:", error)
    }
}

const startCamera2 = async (deviceId: string) => {
    if (!camera2Input.value) return
    try {
        camera2Stream.value = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
            audio: false
        })
        camera2Input.value.srcObject = camera2Stream.value
        console.log('✅ Camera 2 started:', deviceId)
    } catch (error) {
        console.error("Could not start camera 2:", error)
    }
}

const stopCamera = async () => {
    if (!cameraInput.value || !cameraInput.value.srcObject) return
    try {
        const stream = cameraInput.value.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
        cameraInput.value.srcObject = null
    } catch (error) {
        console.error("Could not stop camera:", error)
    }
}

const stopCamera2 = async () => {
    if (!camera2Input.value || !camera2Input.value.srcObject) return
    try {
        const stream = camera2Input.value.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
        camera2Input.value.srcObject = null
        camera2Stream.value = null
    } catch (error) {
        console.error("Could not stop camera 2:", error)
    }
}

const updateCameraStatesInFirestore = async () => {
    try {
        const roomMetaDoc = doc(firestore.value, 'room-meta', roomID.value)
        await setDoc(roomMetaDoc, {
            selectedCam: selectedCam.value,
            camera1: selectedCameraId.value,
            camera2: selectedCamera2Id.value,
            camera1Name: camera1Name.value,
            camera2Name: camera2Name.value,
            camera1Mirror: camera1Mirror.value,
            camera2Mirror: camera2Mirror.value,
            updatedAt: Timestamp.now()
        }, { merge: true })
    } catch (err) {
        console.error('Error updating camera states', err)
    }
}

const firestore = computed(() => {
    return $firestore as Firestore
})

const join = async () => {
    startTime.value = Date.now()
    onCall.value = true

    const res = await joinChannel(selectedCameraId.value ?? undefined)
    const localElement = document.getElementById('local-stream')
    if (localElement) {
        res?.localVideoTrack.value?.play(localElement)
    }
    await updateCameraStatesInFirestore()
}

const listenToDrawingUpdates = async () => {
    const linesCollection = collection(firestore.value, roomID.value)
    const q = query(linesCollection, orderBy('timestamp'))
    onSnapshot(q, (snapshot) => {
        // Filter out _init doc from lines
        const annotationDocs = snapshot.docs.filter(doc => doc.id !== '_init')
        showEraserLine.value = annotationDocs.length > 0
        lines.value = annotationDocs.map(doc => doc.data() as LineData)
        drawLineOnCanvas()
    })
}

const setCanvasSize = () => {
    if (!canvas.value) return
    ctxCanvas.value = canvas.value.getContext('2d')
    if (ctxCanvas.value) {
        const video = cameraInput.value
        const displayedWidth = video?.clientWidth || 0
        const displayedHeight = video?.clientHeight || 0
        canvas.value.width = displayedWidth
        canvas.value.height = displayedHeight
        ctxCanvas.value.lineWidth = 2
    }
}

const drawLineOnCanvas = () => {
    if (!ctxCanvas.value || !canvas.value) return
    
    ctxCanvas.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
    
    // Save current context state
    ctxCanvas.value.save()
    
    // If mirrored, flip the canvas context for drawing
    if (currentMirrorState.value) {
        ctxCanvas.value.translate(canvas.value.width, 0)
        ctxCanvas.value.scale(-1, 1)
    }
    
    lines.value.forEach(lineData => {
        if (ctxCanvas.value && canvas.value) {
            const width = canvas.value.width
            const height = canvas.value.height
            
            // Use color from lineData, fallback to role-based color
            ctxCanvas.value.strokeStyle = lineData.color || (lineData.role === 1 ? 'blue' : 'red')
            ctxCanvas.value.beginPath()
            ctxCanvas.value.moveTo(lineData.startX * width, lineData.startY * height)
            ctxCanvas.value.lineTo(lineData.endX * width, lineData.endY * height)
            ctxCanvas.value.stroke()
        }
    })
    
    // Restore context state
    ctxCanvas.value.restore()
}

const listenUserPublish = async () => {
    client.value.on('user-published', async (user: { uid: any; videoTrack: any; audioTrack: any }, mediaType: string) => {
        if (user.uid === userUUID.value) return
        if (mediaType === 'video') {
            await client.value.subscribe(user, 'video')
            const remoteStream = user.videoTrack
            const remoteElement = document.getElementById('remote-stream')
            if (remoteElement) {
                remoteStream.play(remoteElement)
            }
        } else if (mediaType === 'audio') {
            await client.value.subscribe(user, 'audio')
            user.audioTrack.play()
        }
    })
}

// Helper function to adjust coordinates when mirrored
const adjustCoordinatesForMirror = (x: number, y: number): { x: number, y: number } => {
    if (currentMirrorState.value && canvas.value) {
        // When mirrored, flip the x coordinate
        return { x: 1 - x, y }
    }
    return { x, y }
}

// Host can draw (keeping the code but won't be used much)
const startDraw = (event: MouseEvent) => {
    isDrawing.value = true
    const coords = getCoordinates(event, canvas.value)
    const adjusted = adjustCoordinatesForMirror(coords.x, coords.y)
    lastX.value = adjusted.x
    lastY.value = adjusted.y
}

const draw = (event: MouseEvent) => {
    if (!isDrawing.value || !ctxCanvas.value) return
    const coords = getCoordinates(event, canvas.value)
    const adjusted = adjustCoordinatesForMirror(coords.x, coords.y)
    
    const lineData: LineData = { 
        startX: lastX.value!, 
        startY: lastY.value!, 
        endX: adjusted.x, 
        endY: adjusted.y, 
        role: 1,
        color: 'blue',
        timestamp: Timestamp.now()
    }
    lines.value.push(lineData)
    addLineDataToFirestore(lineData)
    drawLineOnCanvas()
    lastX.value = adjusted.x
    lastY.value = adjusted.y
}

const stopDraw = () => {
    isDrawing.value = false
}

const startDrawTouch = (event: TouchEvent) => {
    isDrawing.value = true
    const coords = getCoordinates(event, canvas.value, true)
    const adjusted = adjustCoordinatesForMirror(coords.x, coords.y)
    lastX.value = adjusted.x
    lastY.value = adjusted.y
}

const drawTouch = (event: TouchEvent) => {
    if (!isDrawing.value || !ctxCanvas.value) return
    const coords = getCoordinates(event, canvas.value, true)
    const adjusted = adjustCoordinatesForMirror(coords.x, coords.y)
    
    const lineData: LineData = { 
        startX: lastX.value!, 
        startY: lastY.value!, 
        endX: adjusted.x, 
        endY: adjusted.y, 
        role: 1,
        color: 'blue',
        timestamp: Timestamp.now()
    }
    lines.value.push(lineData)
    addLineDataToFirestore(lineData)
    drawLineOnCanvas()
    lastX.value = adjusted.x
    lastY.value = adjusted.y
}

const addLineDataToFirestore = async (lineData: LineData) => {
    try {
      const linesCollection = collection(firestore.value, roomID.value)
      await addDoc(linesCollection, lineData)
    } catch (err) {
      console.error('Error saving line data', err)
    }
}
</script>