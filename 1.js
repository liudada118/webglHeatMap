function genAllData(bodyArr, leftArr, rightArr, { canvasWidth, canvasHeigth }) {

    let heightIndex = 0, newArr = []
    for (let index = 0; index < bodyArr.length; index++) {
        {
           
            const height = 24, width = 24, order = 2, interp1 = 1, interp2 = 2
            const arr = bodyArr[index]
            console.log(bodyArr[index])
            let resArr = arr
            resArr = addSide(
                resArr,
                height,
                width,
                order,
                order,
                1
            );
            const interpArr = interpSmall(resArr, height + order * 2, width + order * 2, interp1, interp2)

            resData = interpArr
            // console.log(resData)
            let dataWidth = 28, dataHeight = 56, canvas = { width: canvasWidth, height: canvasHeigth }
            const canvasRealHeight = canvas.height * index * 2
            for (let i = 0; i < dataHeight; i++) {
                for (let j = 0; j < dataWidth; j++) {
                    let obj = {}
                    obj.y = i * canvas.width / dataWidth
                    obj.x = j * canvas.height / dataHeight
                    obj.value = resData[i * dataWidth + j]
                    // data.push(obj)
        
                    newArr.push([j * parseInt(canvas.width / dataWidth), 0 + (i) * parseInt(canvas.height / dataHeight), resData[i * dataWidth + j]])
                }

            }
            console.log(newArr)
        }

        {
            const height = 4, width = 4, order = 2, interp1 = 1, interp2 = 4
            const arr = leftArr[index]
            let resArr = arr
            resArr = addSide(
                resArr,
                height,
                width,
                order,
                order,
                1
            );
            const interpArr = interpSmall(resArr, height + order * 2, width + order * 2, interp1, interp2)

            resData = interpArr


            const arr1 = rightArr[index]
            let resArr1 = arr1
            resArr1 = addSide(
                resArr1,
                height,
                width,
                order,
                order,
                1
            );
            const interpArr1 = interpSmall(resArr1, height + order * 2, width + order * 2, interp1, interp2)

            resData1 = interpArr1
            console.log(resData, resData1)
            let dataWidth = 8, dataHeight = 32, canvas = { width: canvasWidth, height: canvasHeigth }

            const canvasNewHeight = canvasHeigth * 2 * (index + 1) - 1

            for (let i = 0; i < dataHeight; i++) {
                for (let j = 0; j < dataWidth; j++) {


                    let obj = {}
                    obj.y = i * canvas.width / dataWidth
                    obj.x = j * canvas.height / dataHeight
                    obj.value = resData[i * dataWidth + j]
                    // data.push(obj)

                    newArr.push([j * parseInt(canvasWidth / 4 / dataWidth), canvasNewHeight + i * parseInt(canvas.height / dataHeight), resData[i * dataWidth + j]])

                }

            }

            // for (let i = 0; i < dataHeight; i++) {
            //     for (let j = 0; j < dataWidth; j++) {


            //         let obj = {}
            //         obj.y = i * canvas.width / dataWidth
            //         obj.x = j * canvas.height / dataHeight
            //         obj.value = resData1[i * dataWidth + j]
            //         // data.push(obj)

            //         newArr.push([canvasWidth / 4 + j * parseInt(canvas.width / dataWidth), canvasNewHeight + i * parseInt(canvas.height / dataHeight), 0])

            //     }

            // }

            for (let i = 0; i < dataHeight; i++) {
                for (let j = 0; j < dataWidth; j++) {


                    let obj = {}
                    obj.y = i * canvas.width / dataWidth
                    obj.x = j * canvas.height / dataHeight
                    obj.value = resData1[i * dataWidth + j]
                    // data.push(obj)

                    newArr.push([canvasWidth / 2 + j * parseInt(canvas.width / dataWidth), canvasNewHeight + i * parseInt(canvas.height / dataHeight), resData[i * dataWidth + j]])

                }

            }

            // for (let i = 0; i < dataHeight; i++) {
            //     for (let j = 0; j < dataWidth; j++) {


            //         let obj = {}
            //         obj.y = i * canvas.width / dataWidth
            //         obj.x = j * canvas.height / dataHeight
            //         obj.value = resData1[i * dataWidth + j]
            //         // data.push(obj)

            //         newArr.push([canvasWidth * 3 / 4 + j * parseInt(canvas.width / dataWidth), canvasNewHeight + i * parseInt(canvas.height / dataHeight), 0])

            //     }

            // }

            console.log(newArr.length)
        }
    }
    return newArr
}
