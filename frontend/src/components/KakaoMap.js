import React, { useEffect, useState } from "react";
import { Map, MapMarker, useMap } from "react-kakao-maps-sdk";
import tamtam from "../assets/images/tamtam.svg";

// PolylineComponent: 마커를 선으로 연결
function PolylineComponent({ positions }) {
  const map = useMap();

  useEffect(() => {
    const { kakao } = window;

    if (!map || positions.length < 2) return;

    const linePath = positions.map(
      (position) =>
        new kakao.maps.LatLng(position.latlng.lat, position.latlng.lng)
    );

    const polyline = new kakao.maps.Polyline({
      map,
      path: linePath,
      strokeWeight: 5,
      strokeColor: "#FFAE00",
      strokeOpacity: 0.7,
      strokeStyle: "solid",
    });

    return () => polyline.setMap(null); // 컴포넌트 언마운트 시 제거
  }, [map, positions]);

  return null;
}

function KakaoMap() {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const { kakao } = window;
    if (!kakao || !kakao.maps || !kakao.maps.services) {
      console.error("Kakao Maps API가 로드되지 않았습니다.");
      return;
    }

    const geocoder = new kakao.maps.services.Geocoder();

    async function fetchItineraryFromSessionStorage() {
      try {
        const storedData = sessionStorage.getItem("places");
        if (!storedData) {
          console.error("세션 스토리지에 'places' 키가 없습니다.");
          return;
        }

        const parsedData = JSON.parse(storedData);
        const fetchedPositions = [];

        for (const dayKey in parsedData) {
          const daySpots = parsedData[dayKey];
          for (const spot of daySpots) {
            const { name, address } = spot;

            await new Promise((resolve) => {
              geocoder.addressSearch(address, (result, status) => {
                if (status === kakao.maps.services.Status.OK) {
                  const coordinates = {
                    title: name,
                    latlng: {
                      lat: parseFloat(result[0].y),
                      lng: parseFloat(result[0].x),
                    },
                  };
                  fetchedPositions.push(coordinates);
                } else {
                  console.error(
                    `Failed to fetch coordinates for ${name} (${address}):`,
                    status
                  );
                }
                resolve();
              });
            });
          }
        }

        setPositions(fetchedPositions);
      } catch (error) {
        console.error("Error fetching itinerary from session storage:", error);
      }
    }

    fetchItineraryFromSessionStorage();
  }, []);

  return (
    <Map
      center={positions[0]?.latlng || { lat: 37.5665, lng: 126.978 }}
      style={{ width: "100%", height: "100%" }}
      level={9}
    >
      {/* PolylineComponent: 마커를 잇는 선 */}
      {positions.length > 1 && <PolylineComponent positions={positions} />}

      {/* MapMarker: 마커 표시 */}
      {positions.map((position, index) => (
        <MapMarker
          key={`${position.title}-${index}`}
          position={position.latlng}
          image={{
            src: tamtam,
            size: {
              width: 24,
              height: 35,
            },
          }}
          title={position.title}
        >
          {/* 첫 번째 마커에만 InfoWindow 표시 */}
          {index === 0 && (
            <div style={{ padding: "5px", color: "#000" }}>
              이곳에서 여행을 시작하세요!
            </div>
          )}
        </MapMarker>
      ))}
    </Map>
  );
}

export default KakaoMap;
