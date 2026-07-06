<?php

namespace fast;

use app\common\library\Aliyun;
use think\Request;

/**
 * 版本检测和对比
 */
class Utils
{

	/**
	 * xml转数组
	 * @param string $xml
	 * @return array|bool|mixed
	 */
	public static function xml2array($xml)
	{
		if (empty($xml)) {
			return [];
		}
		$result = [];
		libxml_disable_entity_loader(true);
		if (preg_match('/(\<\!DOCTYPE|\<\!ENTITY)/i', $xml)) {
			return false;
		}
		$xmlObj = simplexml_load_string($xml);
		if ($xmlObj === false) {
			return $result;
		} else {
			$result = json_decode(json_encode($xmlObj), true);
			if (is_array($result)) {
				return $result;
			} else {
				return [];
			}
		}
	}

	/**
	 * 错误信息
	 * @param array $data
	 * @return bool
	 */
	public static function is_error($data)
	{
		if ($data == false || (is_array($data) && array_key_exists('errno', $data) && $data['errno'] != 0)) {
			return false;
		} else {
			return true;
		}
	}

	/**
	 * 替换字符串中的相对地址为绝对地址
	 * @param $src
	 * @param string $host 可以指定地址，如不设置默认为系统地址
	 * @return string
	 */
	public static function toMedia($src, $host = '')
	{
		$lowerSrc = ltrim(strtolower($src), '/');
		if (strpos($lowerSrc, 'http://') === 0 || strpos($lowerSrc, 'https://') === 0) {
			return $src;
		}
		$host = !empty($host) ? $host : request()->domain();
		if (strpos($host, 'http') === false) {
			$host = 'http://' . $host;
		}
		if (strpos($lowerSrc, 'uploads') === 0) {
			return $host . '/' . ltrim($src, '/');
		}
		// 富文本正则替换
		return preg_replace('/(\=[\'|\"])(\/?uploads\/)/i', '${1}' . $host . '/uploads/', $src, -1);
	}

	/**
	 * 验证身份证号
	 */
	public static function checkIdCard($idcard)
	{
		if (strlen($idcard) == 18) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * 验证姓名
	 */
	public static function checkUsername($username)
	{
		if (mb_substr($username, 0, 1, 'utf-8')) {
			return true;
		} else {
			return false;
		}
	}

	/**
	 * base64图片解码上传图片
	 * @param $thumb_base64
	 * @return string
	 * @throws \yii\db\Exception
	 */
	public static function base64pic($thumb_base64, $uid = 0)
	{
		//项目绝对路径
		$url = str_replace('\\', '/', ROOT_PATH . "public");
		if (preg_match('/^(data:\s*image\/(\w+);base64,)/', $thumb_base64, $result)) {
			$type = $result[2];
			if (!in_array($type, ['png', 'jpeg', 'gif', 'jepg', 'jpg'])) {
				return false;
			}
			$strlen = strlen($thumb_base64);
			$img = base64_decode(str_replace($result[1], '', $thumb_base64));
			$new_file = $url . '/uploads/' . date('Ymd', time()) . '/';
			if (!file_exists($new_file)) {
				mkdir($new_file, 0777, true);
			}
			$info_file = date("YmdHis") . "_" . $uid . '_' . rand(10000, 99999) . '.' . "{$type}";
			$new_file = $new_file . $info_file;
			//数据库存储地址
			$db_file = '/uploads/' . date('Ymd', time()) . '/' . $info_file;
			$oss = Aliyun::getOss();
			$thumbUrl = $oss->uploadOs(trim($db_file, "/"), $img);
			if ($file = file_put_contents($new_file, $img)) {
				self::toAttachment($thumbUrl, $type, $strlen, $uid);
				return $thumbUrl;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}

	/**
	 * 图片存储 数据库记录
	 */
	public static function toAttachment($thumb, $type, $strlen = 0, $uid = 0)
	{
		$imgInfo = getimagesize($thumb);
		$params = array(
			'admin_id' => 0,
			'user_id' => (int)$uid,
			'filesize' => $strlen,
			'imagewidth' => $imgInfo[0],
			'imageheight' => $imgInfo[1],
			'imagetype' => $type,
			'imageframes' => 0,
			'mimetype' => $imgInfo['mime'],
			'url' => $thumb,
			'uploadtime' => time(),
			'storage' => 'aliyun',
			'sha1' => md5($thumb),
		);
		$attachment = model("attachment");
		$attachment->data(array_filter($params));
		$attachment->save();
	}

	/**
	 * 获取用户真实IP
	 * @return array|false|string
	 */
	public static function getIp()
	{
		$ip = $_SERVER['REMOTE_ADDR'];
		if (isset($_SERVER['HTTP_CDN_SRC_IP'])) {
			$ip = $_SERVER['HTTP_CDN_SRC_IP'];
		} elseif (isset($_SERVER['HTTP_CLIENT_IP']) && preg_match('/^([0-9]{1,3}\.){3}[0-9]{1,3}$/', $_SERVER['HTTP_CLIENT_IP'])) {
			$ip = $_SERVER['HTTP_CLIENT_IP'];
		} elseif (isset($_SERVER['HTTP_X_FORWARDED_FOR']) && preg_match_all('#\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}#s', $_SERVER['HTTP_X_FORWARDED_FOR'], $matches)) {
			foreach ($matches[0] AS $xip) {
				if (!preg_match('#^(10|172\.16|192\.168)\.#', $xip)) {
					$ip = $xip;
					break;
				}
			}
		}
		return $ip;
	}

	/**
	 * 计算概率
	 * @param $proArr
	 * @param bool $isDayRose
	 * @return array
	 */
	public static function get_rand($proArr, $isDayRose = false,$field='')
	{
		$result = array();
		foreach ($proArr as $key => $val) {
			if($isDayRose == true && @in_array($field,array('dragon')) && $val['nums']<=0){
				continue;
			}
			$arr[$key] = intval($val['chance'] * 1000);
		}
		// 概率数组的总概率
		$proSum = array_sum($arr);
		if ($proSum <= 0) {
			return $proArr[0];
		}
		asort($arr);
		// 概率数组循环
		foreach ($arr as $k => $v) {
			$randNum = mt_rand(1, $proSum);
			if ($randNum <= $v) {
				$result = $proArr[$k];
				break;
			} else {
				$proSum -= $v;
			}
		}
		return $result;
	}

	/**
	 * 生成随机字符串
	 * @param int $length 字符串长度
	 * @param bool $numeric true表示纯数字
	 * @return string
	 */
	public static function random($length, $numeric = false)
	{
		$seed = base_convert(md5(microtime() . $_SERVER['DOCUMENT_ROOT']), 16, $numeric ? 10 : 35);
		$seed = $numeric ? (str_replace('0', '', $seed) . '012340567890') : ($seed . 'zZ' . strtoupper($seed));
		if ($numeric) {
			$hash = '';
		} else {
			$hash = chr(rand(1, 26) + rand(0, 1) * 32 + 64);
			$length--;
		}
		$max = strlen($seed) - 1;
		for ($i = 0; $i < $length; $i++) {
			$hash .= $seed[mt_rand(0, $max)];
		}
		return $hash;
	}

	/**
	 * 兼容本地路径和绝对路径的图片
	 * @param $path
	 * @return string
	 */
	public static function toPath($path)
	{
		if (strpos($path, 'http') !== false) {
			return $path;
		} else {
			return ROOT_PATH . 'public' . $path;
		}
	}

	/**
	 * 数组 根据 数据中的 某个 字段 重构数据
	 */
	public static function toKeyArray($temp, $keyfield)
	{
		$rs = array();
		if (!empty($temp)) {
			foreach ($temp as $key => &$row) {
				if (isset($row[$keyfield])) {
					$rs[$row[$keyfield]] = $row;
				} else {
					$rs[] = $row;
				}
			}
		}
		return $rs;
	}

	/**
	 * 毫秒
	 */
	public static function msectime()
	{
		list($msec, $sec) = explode(' ', microtime());
		$msectime = (float)sprintf('%.0f', (floatval($msec) + floatval($sec)) * 1000);
		return $msectime;
	}
	/**
	 * 订单号
	 * @param $type
	 * @param $id
	 * @return string
	 */
	public static function getOrderId($type, $id)
	{
		if (strlen($id) < 5) {
			$newId = str_pad($id, 5, "0", STR_PAD_LEFT);
		} else {
			$newId = substr($id, "-5");
		}
		return $type.date("ymdHi").$newId;
	}
    /**
     * 分割字符串
     * @param string $string 要分割的字符串
     * @param int $length 指定的长度
     * @param string $end 在分割后的字符串块追加的内容
     * @param bool $once
     * @return string
     */
    public static function mb_chunk_split($string, $length, $end, $once = false) {
        $array = [];
        $strLen = mb_strlen($string);
        while ($strLen) {
            $array[] = mb_substr($string, 0, $length, "utf-8");
            if ($once) {
                return $array[0].$end;
            }
            $string = mb_substr($string, $length, $strLen, "utf-8");
            $strLen = mb_strlen($string);
        }
        return implode($end, $array);
    }
    /**
     * 微信图片保存本地
     */
    public static function wechatLogoFile($img,$uid,$file = "avatar")
    {
        //项目绝对路径
        $url = str_replace('\\', '/', ROOT_PATH . "public");
        $type = "jpg";
        $new_file = '/uploads/'.$file.'/';
        $root_file = $url . $new_file;
        if (!file_exists($root_file)) {
            mkdir($root_file, 0777, true);
        }
        $filename = $uid . '_' . md5($img) . '.' . "{$type}";
        if(is_file($root_file.$filename)){
            return $new_file.$filename;
        }
        $curl = curl_init($img);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
        $imageData = curl_exec($curl);
        curl_close($curl);
        $tp = @fopen($root_file. $filename, "a");
        fwrite($tp, $imageData);
        fclose($tp);
        return $new_file.$filename;
    }
    /**
     * 将图片切成圆角
     * @param  string $imgpath 本地磁盘图像路径
     * @return file 图像流
     */
    public static function yuanjiao($imgpath){
        $ext = pathinfo($imgpath);
        $src_img = null;
        switch ($ext['extension']) {
            case 'jpg':
                $src_img = imagecreatefromjpeg($imgpath);
                break;
            case 'png':
                $src_img = imagecreatefrompng($imgpath);
                break;
        }
        list($w,$h)  = getimagesize($imgpath);
        $w   = min($w, $h);
        $h   = $w;
        $img = imagecreatetruecolor($w,$h);

        imagesavealpha($img, true);//这一句一定要有
        //拾取一个完全透明的颜色,最后一个参数127为全透明
        $bg = imagecolorallocatealpha($img, 255, 255, 255, 127);
        imagefill($img, 0, 0, $bg);
        $r = $w / 2; //圆半径
        $y_x = $r; //圆心X坐标
        $y_y = $r; //圆心Y坐标
        for ($x = 0; $x < $w; $x++) {
            for ($y = 0; $y < $h; $y++) {
                $rgbColor = imagecolorat($src_img, $x, $y);
                if (((($x - $r) * ($x - $r) + ($y - $r) * ($y - $r)) < ($r * $r))) {
                    imagesetpixel($img, $x, $y, $rgbColor);
                }
            }
        }
       /* imagepng($img);
        imagedestroy($img);*/
        return $img;
    }
}
