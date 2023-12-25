import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import axios from 'axios';

// const API_HOST = 'https://14f4-222-253-79-230.ngrok-free.app';
const API_HOST = 'http://localhost:8796';

enum ProcessStatusEnum {
  FAILED = -1,
  PENDING = 0,
  SUCCESS = 1,
}

const App = () => {
  const [hasPermission, setHasPermission] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const cameraRef = React.useRef<Camera>(null);
  const generateFileName = (): string => {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(7);
    return `${timestamp}_${randomString}`;
  };
  const handleCapture = async () => {
    setIsLoading(true);
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'balanced',
      });

      const formData = new FormData();
      formData.append('img', {
        uri: `file://${photo.path}`,
        type: 'image/jpeg',
        name: generateFileName() + '.jpg',
      });

      try {
        const response = await fetch(`${API_HOST}/process`, {
          method: 'POST',
          body: formData,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        });
        if (response.status === 200) {
          const responseData = await response.json();
          console.log(responseData);

          setIsLoading(false);
          // return sample
          // {"distance": 0.452579140663147, "dominant_emotion": "angry", "emotion": {"angry": 57.85095440453019, "disgust": 0.02035318587683504, "fear": 1.1168269174889873, "happy": 2.924159089300988e-7, "neutral": 31.522234172954214, "sad": 9.489631473400085, "surprise": 0.000002776741846538747}, "id": 7, "img_path": "public/faces/IMG_2023-11-26_20-16-55.jpg", "name": "Nguyen Hoang Duy", "status": 1, "student_id": "22520328"}
          // Switch Status for ProcessStatusEnum
          switch (responseData.status) {
            case ProcessStatusEnum.SUCCESS:
              Alert.alert('Checkin Success', `Name: ${responseData.name}\nStudent ID: ${responseData.student_id}\nDistance: ${responseData.distance}\nEmotion: ${responseData.dominant_emotion}`);
              break;
            case ProcessStatusEnum.PENDING:
              Alert.alert(
                'Checkin Success',
                `Please confirm the information below is correct or not.\nName: ${responseData.name}\nStudent ID: ${responseData.student_id}\nDistance: ${responseData.distance}\nEmotion: ${responseData.dominant_emotion}`,
                [
                  {
                    text: 'Correct',
                    onPress: () => {
                      confirmInformation(responseData.id);
                    },
                  },
                  {
                    text: 'Not Correct',
                    style: 'cancel',
                  },
                ]
              );
              break;
            case ProcessStatusEnum.FAILED:
              Alert.alert('Checkin Failed', 'Failed to process the image. Please try again later.');
              break;
            default:
              Alert.alert('Checkin Failed', 'Failed to process the image. Please try again later.');
              break;
          }
        } else {
          Alert.alert('Checkin Failed', 'Failed to process the image. Please try again later.');
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Checkin Failed', 'An error occurred while processing the image. Please try again later.');

        setIsLoading(false);
      }
    }
  };

  const confirmInformation = async (id: number) => {
    try {
      const response = await axios.post(`${API_HOST}/confirm`, { id });
      if (response.status === 200) {
        Alert.alert('Confirmation Success', 'Information confirmed successfully.');
      } else {
        Alert.alert('Confirmation Failed', 'Failed to confirm the information. Please try again later.');
      }

      setIsLoading(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Confirmation Failed', 'An error occurred while confirming the information. Please try again later.');

      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.getCameraPermissionStatus()
      if (!cameraPermission || cameraPermission !== 'authorized') {
        await Camera.requestCameraPermission()
        setHasPermission(true)
      }
    })()
  }, [])

  const devices = useCameraDevices()
  const device = devices.front
  if (device == null) return <><ActivityIndicator /></>
  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} ref={cameraRef} device={device} isActive={true} photo={true} />
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 16,
          alignSelf: 'center',
          backgroundColor: 'white',
          borderRadius: 24,
          padding: 12,
        }}
        onPress={handleCapture}
        disabled={isLoading}
      >
        <Text>Capture</Text>
      </TouchableOpacity>
      {isLoading && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

export default App;
